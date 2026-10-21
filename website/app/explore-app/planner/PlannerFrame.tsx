"use client";
import {useEffect,useState} from 'react';
import styles from './planner.module.css';
export default function PlannerFrame(){
 const [src,setSrc]=useState('/explore-app/planner-content.html');
 useEffect(()=>{if(location.hash)setSrc('/explore-app/planner-content.html'+location.hash);},[]);
 return <iframe className={styles.focusFrame} src={src} title="Competition photography and mountain calendar planner"/>;
}
