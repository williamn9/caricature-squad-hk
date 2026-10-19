# Crew profile photos

Source portraits (editable masters): `photos/profile/` in the project root  
Site copies (served): `website/assets/artists/<id>/profile.jpeg`

| Source file | id | name |
|-------------|----|------|
| `william.png` | william | William |
| `suet.png` | ah-suet | 阿雪 / Suet |
| `skywalker.png` | wei-gor | 威哥 / Skywalker |
| `mangor.png` | mangor | 文哥 / Mangor |

After updating a PNG in `photos/profile/`, re-export into `assets/artists/<id>/profile.jpeg` (or ask the agent to sync).

Social links live in `artists.js` under each person’s `socials` object (`instagram`, `facebook`, `youtube`). Omit keys they don’t use.
