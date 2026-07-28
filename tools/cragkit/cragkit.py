#!/usr/bin/env python3
"""
cragkit — turn a waypoint GPX of crag sectors into a documented, analysed area file.

Vertical Moment pipeline. Works on any area, not just Wachau.

    python cragkit.py AREA.gpx --name "Wachau" --out ./out
    python cragkit.py AREA.gpx --name "Hohe Wand" --out ./out --dem hw_dem.tif
    python cragkit.py AREA.gpx --name "Mödling" --out ./out --dates 2026-04-15,2026-10-01

Produces, per area:
    sectors.csv / sectors.geojson / master.json   canonical sector database
    sun_shade.csv / sun_shade.md                  per-sector sun window per date
    walking_route.csv / walking_route.md          optimised ground order + timings
    terrain.csv                                   aspect, slope, horizon (DEM if given)

--dem is optional. Without it, wall aspect is estimated by fitting a plane to each
sector's nearest neighbours, and terrain shading is not modelled — the sun table then
answers "is the sun on this aspect" rather than "is this wall lit". With a DEM it
answers the second, which is the one that matters at 08:00 in a north-facing gully.
"""

import argparse, csv, json, math, os, re, unicodedata, datetime as dt
import numpy as np
from scipy.cluster.hierarchy import linkage, fcluster
from scipy.spatial.distance import pdist, squareform

R_EARTH = 6378137.0

# ---------------------------------------------------------------- parsing

def parse_gpx(path):
    import xml.etree.ElementTree as ET
    ns = {'g': 'http://www.topografix.com/GPX/1/1'}
    root = ET.parse(path).getroot()
    pts = []
    for w in root.findall('g:wpt', ns):
        name = w.find('g:name', ns)
        ele = w.find('g:ele', ns)
        pts.append(dict(
            name=(name.text if name is not None else 'unnamed').strip(),
            lat=float(w.get('lat')), lon=float(w.get('lon')),
            ele=float(ele.text) if ele is not None else 0.0))
    return pts


def slugify(s):
    s = (s.replace('ä', 'ae').replace('ö', 'oe').replace('ü', 'ue').replace('ß', 'ss')
          .replace('ł', 'l').replace('ą', 'a').replace('ę', 'e').replace('ś', 's')
          .replace('ż', 'z').replace('ź', 'z').replace('ć', 'c').replace('ń', 'n').replace('ó', 'o'))
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '_', s.lower()).strip('_')


def dedupe(pts, tol_m=25.0, review_m=300.0):
    """Merge same-name waypoints that are clearly the same rock; flag the ambiguous ones.

    Two points sharing a name 10 m apart are one crag tagged twice. Two sharing a name
    600 m apart may be a ridge marked at both ends, which is real data. Anything between
    tol_m and review_m is returned for a human to decide rather than merged silently.
    """
    kept, dropped, review = [], [], []
    for p in pts:
        hit = False
        for q in kept:
            if p['name'] != q['name']:
                continue
            d = haversine(p, q)
            if d < tol_m:
                hit = True
                break
            if d < review_m:
                review.append({'name': p['name'], 'distance_m': round(d)})
        (dropped if hit else kept).append(p)
    return kept, dropped, review


def haversine(a, b):
    dlat = math.radians(b['lat'] - a['lat'])
    dlon = math.radians(b['lon'] - a['lon'])
    la = math.radians(a['lat'])
    x = math.sin(dlat / 2) ** 2 + math.cos(la) * math.cos(math.radians(b['lat'])) * math.sin(dlon / 2) ** 2
    return 2 * R_EARTH * math.asin(math.sqrt(x))


# ---------------------------------------------------------------- geometry

def elevation_status(pts):
    """GPX files from some sources carry no <ele>. Detect that instead of silently using 0."""
    vals = [p['ele'] for p in pts]
    if all(v == 0.0 for v in vals) or len(set(round(v, 1) for v in vals)) == 1:
        for p in pts:
            p['elevation_source'] = 'missing'
        return False
    for p in pts:
        p['elevation_source'] = 'gpx'
    return True


def classify_area(pts):
    """A single crag and a whole region need different thresholds and travel assumptions.

    Classified on median nearest-neighbour spacing rather than extent: what decides
    whether you walk or drive between sectors is how they are linked, not how far the
    two outliers happen to reach. Helenental spans 3.2 km but has 85 m median spacing —
    a walkable valley with two outliers, not a driving tour.
    """
    XY = np.array([[p['x'], p['y']] for p in pts])
    extent = float(max(np.ptp(XY[:, 0]), np.ptp(XY[:, 1])))
    if len(pts) < 2:
        return 'crag', extent, 0.0
    D = squareform(pdist(XY)); np.fill_diagonal(D, np.inf)
    med_nn = float(np.median(D.min(axis=1)))
    return ('crag' if med_nn < 400 else 'region'), extent, med_nn


def add_local_enu(pts):
    lat0 = float(np.mean([p['lat'] for p in pts]))
    lon0 = float(np.mean([p['lon'] for p in pts]))
    k = math.cos(math.radians(lat0))
    for p in pts:
        p['x'] = math.radians(p['lon'] - lon0) * R_EARTH * k
        p['y'] = math.radians(p['lat'] - lat0) * R_EARTH
    return lat0, lon0


def cluster(pts, threshold_m):
    XY = np.array([[p['x'], p['y']] for p in pts])
    if len(pts) < 2:
        for p in pts:
            p['cluster'] = 1
        return
    lab = fcluster(linkage(XY, method='single'), threshold_m, criterion='distance')
    # renumber so cluster 1 is the largest
    order = [c for c, _ in sorted(
        ((c, list(lab).count(c)) for c in set(lab)), key=lambda t: -t[1])]
    remap = {c: i + 1 for i, c in enumerate(order)}
    for p, l in zip(pts, lab):
        p['cluster'] = remap[l]


def neighbour_stats(pts):
    XY = np.array([[p['x'], p['y']] for p in pts])
    D = squareform(pdist(XY))
    np.fill_diagonal(D, np.inf)
    for p, row in zip(pts, D):
        p['nn_m'] = float(row.min())
        p['nn_name'] = pts[int(row.argmin())]['name']
    return D


# ---------------------------------------------------------------- terrain

def aspect_from_neighbours(pts, k=6, max_radius_m=150.0):
    """Fit a plane to each sector's k nearest neighbours; downhill direction ~ wall aspect.

    Crude, but for a crag the rock generally faces the way the ground falls away.
    Flagged as 'estimated' in the output so it never silently passes for surveyed data.
    """
    if any(p.get('elevation_source') == 'missing' for p in pts):
        for p in pts:
            p['aspect_deg'], p['slope_deg'] = None, None
            p['terrain_source'] = 'unavailable_no_elevation'
        return
    XY = np.array([[p['x'], p['y']] for p in pts])
    D = squareform(pdist(XY))
    np.fill_diagonal(D, np.inf)
    for i, p in enumerate(pts):
        near = np.where(D[i] <= max_radius_m)[0]
        idx = near[np.argsort(D[i][near])][:k]
        p['aspect_radius_m'] = round(float(D[i][idx].max())) if len(idx) else None
        if len(idx) < 3:
            # Fewer than three neighbours within max_radius_m: any plane fitted here
            # would describe the regional slope of the massif, not this wall. Every
            # Peilstein/Rodaun sector came out N/NNW — the tilt of the Wienerwald, not
            # the rock. Better to return nothing than a confident wrong bearing.
            p['aspect_deg'], p['slope_deg'] = None, None
            p['terrain_source'] = 'unreliable_sectors_too_far_apart'
            continue
        A = np.array([[pts[j]['x'], pts[j]['y'], 1.0] for j in idx] + [[p['x'], p['y'], 1.0]])
        z = np.array([pts[j]['ele'] for j in idx] + [p['ele']])
        if len(A) < 4:
            p['aspect_deg'], p['slope_deg'], p['terrain_source'] = None, None, 'insufficient'
            continue
        coef, *_ = np.linalg.lstsq(A, z, rcond=None)
        dzdx, dzdy = coef[0], coef[1]
        slope = math.degrees(math.atan(math.hypot(dzdx, dzdy)))
        aspect = (math.degrees(math.atan2(-dzdx, -dzdy))) % 360   # downhill, from north
        p['aspect_deg'] = round(aspect, 1)
        p['slope_deg'] = round(slope, 1)
        p['terrain_source'] = 'estimated_from_waypoints'


def terrain_from_dem(pts, dem_path, horizon_bins=36, max_km=8.0):
    """Aspect, slope and a horizon profile sampled from a DEM. Needs rasterio + pyproj."""
    import rasterio
    from pyproj import Transformer
    src = rasterio.open(dem_path)
    band = src.read(1).astype('float64')
    tr = Transformer.from_crs('EPSG:4326', src.crs, always_xy=True)
    inv = Transformer.from_crs(src.crs, 'EPSG:4326', always_xy=True)
    nod = src.nodata

    def sample(px, py):
        try:
            r, c = src.index(px, py)
        except Exception:
            return None
        if not (0 <= r < band.shape[0] and 0 <= c < band.shape[1]):
            return None
        v = band[r, c]
        if nod is not None and v == nod:
            return None
        return float(v)

    resx = abs(src.transform.a)
    for p in pts:
        px, py = tr.transform(p['lon'], p['lat'])
        z0 = sample(px, py)
        p['dem_ele'] = None if z0 is None else round(z0, 1)
        if z0 is not None and p.get('elevation_source') == 'missing':
            p['ele'] = float(z0)
            p['elevation_source'] = 'dem'
        base = z0 if z0 is not None else p['ele']

        # slope / aspect from a 3x3 stencil one cell wide
        d = resx
        zs = {}
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                zs[(dx, dy)] = sample(px + dx * d, py + dy * d)
        if all(v is not None for v in zs.values()):
            dzdx = ((zs[(1, -1)] + 2 * zs[(1, 0)] + zs[(1, 1)]) -
                    (zs[(-1, -1)] + 2 * zs[(-1, 0)] + zs[(-1, 1)])) / (8 * d)
            dzdy = ((zs[(-1, 1)] + 2 * zs[(0, 1)] + zs[(1, 1)]) -
                    (zs[(-1, -1)] + 2 * zs[(0, -1)] + zs[(1, -1)])) / (8 * d)
            p['slope_deg'] = round(math.degrees(math.atan(math.hypot(dzdx, dzdy))), 1)
            p['aspect_deg'] = round(math.degrees(math.atan2(-dzdx, -dzdy)) % 360, 1)
            p['terrain_source'] = 'dem'

        # horizon: max elevation angle per azimuth bin
        hor = []
        for b in range(horizon_bins):
            az = 360.0 * b / horizon_bins
            a = math.radians(az)
            best = 0.0
            step = max(resx, 10.0)
            dist = step
            while dist <= max_km * 1000:
                zx = px + dist * math.sin(a)
                zy = py + dist * math.cos(a)
                z = sample(zx, zy)
                if z is not None:
                    ang = math.degrees(math.atan2(z - base - 2.0, dist))
                    if ang > best:
                        best = ang
                dist += step * (1 + dist / 800.0)   # coarser sampling further out
            hor.append(round(best, 2))
        p['horizon'] = hor
    src.close()


# ---------------------------------------------------------------- sun

def solar_position(when_utc, lat, lon):
    """NOAA low-precision solar position. Returns (elevation_deg, azimuth_deg_from_north)."""
    jd = (when_utc - dt.datetime(2000, 1, 1, 12, tzinfo=dt.timezone.utc)).total_seconds() / 86400.0
    L = (280.460 + 0.9856474 * jd) % 360
    g = math.radians((357.528 + 0.9856003 * jd) % 360)
    lam = math.radians(L + 1.915 * math.sin(g) + 0.020 * math.sin(2 * g))
    eps = math.radians(23.439 - 0.0000004 * jd)
    dec = math.asin(math.sin(eps) * math.sin(lam))
    ra = math.atan2(math.cos(eps) * math.sin(lam), math.cos(lam))
    gmst = (18.697374558 + 24.06570982441908 * jd) % 24
    lmst = (gmst + lon / 15.0) % 24
    ha = math.radians(((lmst * 15.0 - math.degrees(ra) + 180) % 360) - 180)
    phi = math.radians(lat)
    el = math.asin(math.sin(phi) * math.sin(dec) + math.cos(phi) * math.cos(dec) * math.cos(ha))
    ce = math.cos(el)
    if abs(ce) < 1e-9:
        return math.degrees(el), 0.0
    cosaz = (math.sin(dec) - math.sin(el) * math.sin(phi)) / (ce * math.cos(phi))
    az = math.degrees(math.acos(max(-1.0, min(1.0, cosaz))))
    if math.sin(ha) > 0:
        az = 360.0 - az
    return math.degrees(el), az


def eu_utc_offset(d):
    """Central European Time with EU summer-time rule. Returns hours."""
    def last_sunday(year, month):
        day = 31
        while True:
            try:
                x = dt.date(year, month, day)
            except ValueError:
                day -= 1
                continue
            if x.weekday() == 6:
                return x
            day -= 1
    y = d.year
    return 2 if last_sunday(y, 3) <= d < last_sunday(y, 10) else 1


def horizon_at(p, az, bins=36):
    h = p.get('horizon')
    if not h:
        return 0.0
    i = int(round(az / (360.0 / len(h)))) % len(h)
    return h[i]


def sun_windows(pts, dates, step_min=10, grazing_deg=85.0):
    """For each sector and date: when the wall is lit, in local time."""
    out = []
    for ds in dates:
        d = dt.date.fromisoformat(ds)
        off = eu_utc_offset(d)
        times = []
        t = dt.datetime(d.year, d.month, d.day, 0, 0, tzinfo=dt.timezone.utc) - dt.timedelta(hours=off)
        for _ in range(int(24 * 60 / step_min)):
            times.append(t)
            t += dt.timedelta(minutes=step_min)
        for p in pts:
            if p.get('aspect_deg') is None:
                basis = 'open_sky_no_aspect'
            elif p.get('terrain_source') == 'dem':
                basis = 'dem_aspect_and_horizon'
            else:
                basis = 'estimated_aspect'
            lit = []
            for tu in times:
                el, az = solar_position(tu, p['lat'], p['lon'])
                if el <= 0:
                    continue
                if el < horizon_at(p, az):
                    continue                      # behind terrain
                if p.get('aspect_deg') is not None:
                    dazi = abs(((az - p['aspect_deg'] + 180) % 360) - 180)
                    if dazi > grazing_deg:
                        continue                  # sun is behind the wall
                lit.append(tu + dt.timedelta(hours=off))
            if lit:
                first, last = lit[0], lit[-1]
                gaps = []
                for a, b in zip(lit, lit[1:]):
                    if (b - a).total_seconds() > step_min * 60 * 1.5:
                        gaps.append((a, b))
                out.append(dict(
                    date=ds, sector=p['name'], slug=p['slug'],
                    aspect_deg=p.get('aspect_deg'), terrain_source=p.get('terrain_source'),
                    basis=basis,
                    sun_from=first.strftime('%H:%M'), sun_to=last.strftime('%H:%M'),
                    sun_hours=round(len(lit) * step_min / 60.0, 1),
                    interruptions='; '.join(f"{a.strftime('%H:%M')}-{b.strftime('%H:%M')}" for a, b in gaps)))
            else:
                out.append(dict(date=ds, sector=p['name'], slug=p['slug'],
                                aspect_deg=p.get('aspect_deg'), terrain_source=p.get('terrain_source'),
                                basis=basis, sun_from='', sun_to='', sun_hours=0.0,
                                interruptions='shade all day'))
    return out


# ---------------------------------------------------------------- walking route

def tobler_seconds(d_horiz, d_vert):
    if d_horiz < 0.5:
        d_horiz = 0.5
    s = d_vert / d_horiz
    kmh = 6.0 * math.exp(-3.5 * abs(s + 0.05))
    return d_horiz / (kmh * 1000 / 3600.0)


DETOUR = 1.4       # straight line -> road distance, rough Austrian valley factor
ROAD_KMH = 45.0


WALK_MAX_M = 1200.0   # beyond this you get in the car, whatever the map says


def leg_cost(a, b, mode, flat):
    """Seconds between two sectors, and which way you'd actually travel it."""
    dh = math.hypot(a['x'] - b['x'], a['y'] - b['y'])
    if mode == 'auto':
        walk = dh <= WALK_MAX_M      # distance decides, not which group it was filed under
    else:
        walk = (mode == 'walking')
    if walk:
        dv = 0.0 if flat else b['ele'] - a['ele']
        return tobler_seconds(dh, dv), 'walk', dh, dv
    return dh * DETOUR / (ROAD_KMH * 1000 / 3600.0), 'drive', dh, 0.0


def route(pts, start_idx=0, mode='auto'):
    """Optimise visiting order on travel time, walking within a group and driving between.

    A single global travel mode misdescribes any file that mixes scales: Peilstein/Rodaun
    has 200 m hops inside the Kaltenleutgeben belt and an 11 km jump to the southern
    crags. Calling all of that "walking" produced a five-hour march that nobody would do.
    """
    n = len(pts)
    flat = any(p.get('elevation_source') == 'missing' for p in pts)
    T = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            if i != j:
                T[i, j] = leg_cost(pts[i], pts[j], mode, flat)[0]

    unv = set(range(n)) - {start_idx}
    tour = [start_idx]
    while unv:
        cur = tour[-1]
        nxt = min(unv, key=lambda j: T[cur, j])
        tour.append(nxt)
        unv.discard(nxt)

    S = (T + T.T) / 2
    improved = True
    while improved:
        improved = False
        for i in range(1, n - 2):
            for j in range(i + 1, n - 1):
                a, b, c, d = tour[i - 1], tour[i], tour[j], tour[j + 1]
                if S[a, b] + S[c, d] > S[a, c] + S[b, d] + 1e-9:
                    tour[i:j + 1] = tour[i:j + 1][::-1]
                    improved = True

    legs, tsum, walk_s, drive_s, up, down = [], 0.0, 0.0, 0.0, 0.0, 0.0
    for k, idx in enumerate(tour):
        p = pts[idx]
        if k == 0:
            legs.append(dict(order=1, sector=p['name'], cluster=p.get('cluster'), mode='',
                             leg_m=0, leg_min=0, cum_min=0,
                             d_ele='' if flat else 0, bearing=''))
            continue
        q = pts[tour[k - 1]]
        t, how, dh, dv = leg_cost(q, p, mode, flat)
        tsum += t
        if how == 'walk':
            walk_s += t
            up += max(dv, 0); down += min(dv, 0)
        else:
            drive_s += t
        brg = (math.degrees(math.atan2(p['x'] - q['x'], p['y'] - q['y'])) + 360) % 360
        legs.append(dict(order=k + 1, sector=p['name'], cluster=p.get('cluster'), mode=how,
                         leg_m=round(dh), leg_min=round(t / 60, 1),
                         cum_min=round(tsum / 60, 1),
                         d_ele='' if flat else round(dv), bearing=compass(brg)))

    return legs, dict(mode=mode, total_min=round(tsum / 60, 1),
                      walk_min=round(walk_s / 60, 1), drive_min=round(drive_s / 60, 1),
                      ascent_m=None if flat else round(up),
                      descent_m=None if flat else round(down),
                      basis=('per-leg: Tobler on foot within a group, '
                             'straight line x1.4 at 45 km/h between groups'
                             if mode == 'auto' else
                             ('straight_line_x1.4_at_45kmh' if mode == 'driving'
                              else ('tobler_flat_no_elevation' if flat else 'tobler'))))


def compass(b):
    names = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    return names[int((b + 11.25) % 360 // 22.5)]


# ---------------------------------------------------------------- outputs

def write_csv(path, rows, fields=None):
    if not rows:
        return
    fields = fields or list(rows[0].keys())
    with open(path, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction='ignore')
        w.writeheader(); w.writerows(rows)


def main():
    ap = argparse.ArgumentParser(description='Crag GPX -> analysed area file')
    ap.add_argument('gpx')
    ap.add_argument('--name', required=True)
    ap.add_argument('--out', default='./out')
    ap.add_argument('--dem', default=None, help='GeoTIFF DEM covering the area')
    ap.add_argument('--dates', default=None, help='comma-separated ISO dates for the sun table')
    ap.add_argument('--cluster-threshold', type=float, default=None,
                    help='metres; default 250 for a single crag, 3000 for a region')
    ap.add_argument('--start', default=None, help='sector name to start the route from')
    ap.add_argument('--travel', default='auto', choices=['auto', 'walking', 'driving'],
                    help='auto = walk inside a group, drive between groups')
    ap.add_argument('--aspect-radius', type=float, default=150.0,
                    help='max mean neighbour distance for estimating aspect without a DEM')
    ap.add_argument('--dedupe-m', type=float, default=25.0,
                    help='merge same-name waypoints closer than this (metres)')
    a = ap.parse_args()

    os.makedirs(a.out, exist_ok=True)
    raw = parse_gpx(a.gpx)
    pts, dropped, review = dedupe(raw, a.dedupe_m)
    for i, p in enumerate(pts, 1):
        p['slug'] = slugify(p['name'])
    lat0, lon0 = add_local_enu(pts)
    has_ele = elevation_status(pts)
    area_type, extent, med_nn = classify_area(pts)
    thr = a.cluster_threshold
    if thr is None:
        thr = min(3000.0, max(250.0, 4.0 * med_nn))
    cluster(pts, thr)
    for i, p in enumerate(sorted(pts, key=lambda z: (z['cluster'], -z['ele'])), 1):
        p['id'] = f"{slugify(a.name)[:3].upper()}-{p['cluster']}-{i:02d}"
    neighbour_stats(pts)

    if a.dem:
        terrain_from_dem(pts, a.dem)
    else:
        aspect_from_neighbours(pts, max_radius_m=a.aspect_radius)

    dates = a.dates.split(',') if a.dates else ['2026-03-20', '2026-06-21', '2026-09-22', '2026-12-21']
    sun = sun_windows(pts, dates)

    start = 0
    if a.start:
        for i, p in enumerate(pts):
            if p['name'].lower() == a.start.lower():
                start = i
    legs, summary = route(pts, start, a.travel)

    # ---- files
    write_csv(f'{a.out}/sectors.csv', [dict(
        id=p['id'], name=p['name'], slug=p['slug'], cluster=p['cluster'],
        lat=p['lat'], lon=p['lon'],
        ele=round(p['ele'], 1) if p.get('elevation_source') != 'missing' else '',
        elevation_source=p.get('elevation_source'),
        x_m=round(p['x'], 2), y_m=round(p['y'], 2),
        aspect_deg=p.get('aspect_deg'), aspect=compass(p['aspect_deg']) if p.get('aspect_deg') is not None else '',
        slope_deg=p.get('slope_deg'), terrain_source=p.get('terrain_source'),
        nn_m=round(p['nn_m']), nn_name=p['nn_name'],
        scan_status='not_started', routes_documented='', notes='') for p in pts])

    write_csv(f'{a.out}/sun_shade.csv', sun)
    write_csv(f'{a.out}/walking_route.csv', legs)
    write_csv(f'{a.out}/terrain.csv', [dict(
        id=p['id'], name=p['name'], aspect_deg=p.get('aspect_deg'),
        aspect=compass(p['aspect_deg']) if p.get('aspect_deg') is not None else '',
        slope_deg=p.get('slope_deg'), source=p.get('terrain_source'),
        aspect_radius_m=p.get('aspect_radius_m'),
        dem_ele=p.get('dem_ele'),
        gpx_ele=round(p['ele'], 1) if p.get('elevation_source') != 'missing' else '',
        elevation_source=p.get('elevation_source'),
        horizon_max=max(p['horizon']) if p.get('horizon') else '') for p in pts])

    json.dump({'type': 'FeatureCollection', 'features': [
        {'type': 'Feature',
         'geometry': {'type': 'Point', 'coordinates': [p['lon'], p['lat'], p['ele']]},
         'properties': {k: p[k] for k in ('id', 'name', 'slug', 'cluster') if k in p}}
        for p in pts]}, open(f'{a.out}/sectors.geojson', 'w'), ensure_ascii=False, indent=1)

    json.dump({
        'area': a.name, 'source_gpx': os.path.basename(a.gpx),
        'area_type': area_type, 'extent_m': round(extent),
        'cluster_threshold_m': thr, 'has_elevation': has_ele,
        'generated': dt.date.today().isoformat(),
        'origin': {'lat': lat0, 'lon': lon0},
        'dem': a.dem, 'dropped_duplicates': [d['name'] for d in dropped],
        'duplicates_to_review': review, 'median_nn_m': round(med_nn),
        'route_summary': summary,
        'sectors': [{
            'id': p['id'], 'name': p['name'], 'slug': p['slug'], 'cluster': p['cluster'],
            'wgs84': [p['lat'], p['lon']], 'enu': [round(p['x'], 2), round(p['y'], 2),
                    round(p['ele'], 1) if p.get('elevation_source') != 'missing' else None],
            'aspect_deg': p.get('aspect_deg'), 'slope_deg': p.get('slope_deg'),
            'terrain_source': p.get('terrain_source'),
            'elevation_source': p.get('elevation_source'),
            'mesh_file': f"{p['slug']}.obj", 'scan_status': 'not_started', 'routes': []}
            for p in pts]}, open(f'{a.out}/master.json', 'w'), ensure_ascii=False, indent=1)

    # ---- markdown briefs
    with open(f'{a.out}/walking_route.md', 'w', encoding='utf-8') as f:
        f.write(f"# {a.name} — travel order\n\n")
        gain = (f"+{summary['ascent_m']} m / {summary['descent_m']} m on foot"
                if summary['ascent_m'] is not None else "elevation unknown")
        f.write(f"{len(pts)} sectors · {summary['total_min']} min total "
                f"({summary['walk_min']} on foot, {summary['drive_min']} driving) · {gain}\n\n")
        f.write(f"Basis: {summary['basis']}. Driving legs are straight-line distances "
                f"with a 1.4 detour factor, not road routing.\n\n")
        f.write("| # | Sector | Grp | How | Leg | Bearing | Δele | Cumulative |\n"
                "|--|--|--|--|--|--|--|--|\n")
        for l in legs:
            de = f"{l['d_ele']:+} m" if l['d_ele'] != '' else '—'
            how = {'walk': 'foot', 'drive': 'car', '': ''}[l['mode']]
            f.write(f"| {l['order']} | {l['sector']} | {l['cluster']} | {how} | "
                    f"{l['leg_m']} m / {l['leg_min']} min | "
                    f"{l['bearing']} | {de} | {l['cum_min']} min |\n")

    with open(f'{a.out}/sun_shade.md', 'w', encoding='utf-8') as f:
        f.write(f"# {a.name} — sun and shade\n\n")
        src = ('DEM horizon + slope' if a.dem else
               ('open sky only — no elevation in source GPX, aspect unknown' if not has_ele
                else 'estimated aspect, no terrain shading'))
        f.write(f"Method: {src}. Local time (CET/CEST). Grazing cutoff 85° off wall normal.\n\n")
        for ds in dates:
            f.write(f"\n## {ds}\n\n| Sector | Aspect | Sun on wall | Hours |\n|--|--|--|--|\n")
            for r in [x for x in sun if x['date'] == ds]:
                asp = compass(r['aspect_deg']) if r['aspect_deg'] is not None else '?'
                win = f"{r['sun_from']}–{r['sun_to']}" if r['sun_from'] else '—'
                f.write(f"| {r['sector']} | {asp} | {win} | {r['sun_hours']} |\n")

    print(f"{a.name}: {len(pts)} sectors ({len(dropped)} duplicates dropped), "
          f"{len(set(p['cluster'] for p in pts))} clusters")
    print(f"type: {area_type}, extent {round(extent)} m, median spacing {round(med_nn)} m, "
          f"cluster threshold {thr:.0f} m, elevation: {'present' if has_ele else 'MISSING'}")
    if review:
        print("REVIEW: same name at different places — one crag tagged twice, or two places?")
        for r in review:
            print(f"        {r['name']}: two points {r['distance_m']} m apart")
    print(f"route ({summary['mode']}): {summary['total_min']} min total "
          f"= {summary['walk_min']} walking + {summary['drive_min']} driving"
          + (f", +{summary['ascent_m']} m" if summary['ascent_m'] is not None else ", ascent unknown"))
    bad = sum(1 for p in pts if p.get('terrain_source') == 'unreliable_sectors_too_far_apart')
    if bad:
        print(f"WARNING: aspect suppressed for {bad}/{len(pts)} sectors — neighbours too far "
              f"apart to fit a wall plane. Sun table falls back to open sky. Supply --dem.")
    if not has_ele:
        print("WARNING: no <ele> in GPX -> aspect, slope and sun-on-wall cannot be computed.")
        print("         sun_shade.csv falls back to open-sky daylight. Supply --dem to fix.")
    print(f"wrote -> {a.out}")


if __name__ == '__main__':
    main()
