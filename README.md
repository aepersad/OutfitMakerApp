# OutfitMakerApp

## Appendix: Data Cleaning Manipulations

There were 26 data cleaning manipulations performed on the original dataset. The table below details each change, its type, and what was done.

| # | Type | Original | Change |
|---|------|----------|--------|
| 1 | Rename | `PANEL` | Renamed to `Drug_Type` |
| 2 | Rename | `YEAR` | Renamed to `Year` |
| 3 | Rename | `AGE` | Renamed to `Age_Group` |
| 4 | Rename | `ESTIMATE` | Renamed to `Death_Rate_Per_100k` |
| 5 | Rename | `UNIT` | Renamed to `Rate_Type` |
| 6 | Rename | `FLAG` | Renamed to `Unreliable_Flag` |
| 7 | Recode | `UNIT` value | "Deaths per 100,000 resident population, age-adjusted" shortened to "Age-Adjusted" |
| 8 | Recode | `UNIT` value | "Deaths per 100,000 resident population, crude" shortened to "Crude" |
| 9 | Recode | `FLAG` value | Blank/null values recoded to "Reliable" |
| 10 | Recode | `FLAG` value | `*` values recoded to "Unreliable (*)" |
| 11 | Split | `STUB_LABEL` | Parsed into new `Sex` column |
| 12 | Split | `STUB_LABEL` | Parsed into new `Race` column |
| 13 | Split | `STUB_LABEL` | Parsed into new `Hispanic_Origin` column |
| 14 | Fill | `Sex` | Empty values filled with "All" |
| 15 | Fill | `Race` | Empty values filled with "All" |
| 16 | Fill | `Hispanic_Origin` | Empty values filled with "All" |
| 17 | Derive | `STUB_NAME` | New `Race_Classification` column created from existing values |
| 18 | Drop | `INDICATOR` | Removed — same value on every row |
| 19 | Drop | `PANEL_NUM` | Removed — redundant numeric sort key |
| 20 | Drop | `UNIT_NUM` | Removed — redundant numeric sort key |
| 21 | Drop | `STUB_NAME` | Removed — replaced by split columns |
| 22 | Drop | `STUB_NAME_NUM` | Removed — redundant numeric sort key |
| 23 | Drop | `STUB_LABEL` | Removed — replaced by split columns |
| 24 | Drop | `STUB_LABEL_NUM` | Removed — redundant numeric sort key |
| 25 | Drop | `YEAR_NUM` | Removed — redundant numeric sort key |
| 26 | Drop | `AGE_NUM` | Removed — redundant numeric sort key |
