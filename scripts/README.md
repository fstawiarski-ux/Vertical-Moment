# Scripts

Repeatable import, export and validation tools belong here. Scripts must not silently overwrite canonical records.

- `verify-repository-contract.ps1` is read-only. It confirms that the product chooser, product entry documents, agent contracts, stack inventory, recovery ledger and cleanup documents still exist and contain required product markers.

Every PowerShell command block supplied to the owner must begin with an explicit `Set-Location` to the intended repository or working directory.
