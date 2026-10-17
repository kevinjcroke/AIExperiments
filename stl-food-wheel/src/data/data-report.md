# Restaurant data report — 2026-10-17

## Summary

- **18 countries, 44 restaurants**: 8 countries with 3 restaurants and 10 with 2.
- Every restaurant has `lastVerified: "2026-10-17"`.
- **Dining styles:** 30 Casual Sit-Down, 6 Fast Casual, 6 Takeout / Counter, 2 Upscale Sit-Down.
- **Prices:** 9 × `$`, 33 × `$$`, 1 × `$$$`, 1 × `$$$$`.
- **Wheel order:** Bosnia, Thailand, Mexico, Ethiopia, Japan, Italy, Afghanistan, Philippines, Brazil, India, Jamaica, Vietnam, Greece, Ghana, Korea, Lebanon, Nepal, China.

## Method and tool limits (read this)

- **Research used WebSearch only.** WebFetch failed DNS resolution for every host I tried (Yelp, Infatuation, Nominatim, Census geocoder, Photon, restaurant sites). Outbound curl from Bash was blocked by the proxy. So no page was opened directly, and all evidence comes from search-result titles, snippets and structured data that the search tool surfaced.
- **Search budget ran out.** The 200-searches-per-turn budget was used up before dish research was finished. Several restaurants that were verified open were dropped only because I could not confirm a menu-specific dish for them (see "Verified open but dropped").
- **How operating status was checked:** Yelp business-page titles carry an "Updated <Month> 2026" stamp and add "CLOSED" when the business has closed. A 2026 stamp without CLOSED, or a 2026 news or review item, counted as evidence the restaurant is open. Every candidate was also searched for closures, which caught several (see below).
- **How coordinates were sourced:** No geocoder was reachable, so nothing was geocoded. Every lat/lng comes from listing structured data shown in search results (Tripadvisor, MapQuest, Waze, OpenTable, Restaurant Guru, Uber Eats/DoorDash/Caviar, Nextdoor, restaurant sites). Where sources disagreed, I used a value from the cluster where two or more agreed. Single-source coordinates:
  - House of Jollof: Caviar.
  - Afghan Kabob House: DoorDash, with latitude corroborated by Foodeist.
  - Korean Food Mart: MapQuest's Café Ganadara listing at the same address.
  - Brasilia: MapQuest.
  - King & I: Tripadvisor.
- **`sourceUrl`** is usually the Yelp business page that showed the 2026 update stamp. Exceptions:
  - Mai Lee: OpenTable "Updated 2026".
  - Korean Food Mart: St. Louis Magazine article from March 2026.
  - Africana and The Vine: Yelp 2026 category/search pages, because their business pages did not come up.
- **`website`** is set only when search results showed the official domain.

## Dropped candidates

### Closed or no longer a restaurant

| Candidate | Reason |
| --- | --- |
| Grbic Restaurant (Bosnian) | Now a private-event space only (Sauce, Gayot, Restaurantji) |
| Lemmons by Grbic | Yelp "CLOSED" (June 2026) |
| Pho Grand | Closed. Space reopened as Grand Bistro, which is included |
| Banh Mi So 1 | Yelp "CLOSED" (July 2026), MapQuest permanently closed |
| Nudo House, Delmar Loop | Yelp "CLOSED" (Aug 2026). The Creve Coeur location is included |
| Kabul Express STL (Afghan) | Yelp "CLOSED" (May 2026) |
| Afghan Chopan Kabab (Bevo) | Yelp "CLOSED" (Aug 2026), Restaurant Guru permanently closed |
| Chao Baan (Thai) | Closed Sept 20, 2026 (STLPR, St. Louis Magazine, Yelp CLOSED) |
| King & I, South Grand location | Closed. Moved to Richmond Heights, which is included |
| Al-Tarboush Deli (Lebanese) | Yelp "CLOSED" (Aug 2026) |
| Layla (Lebanese) | Both locations closed |
| Café Natasha's (Persian) | Closed (Yelp CLOSED, owner retired) |
| Cocina Latina (Peruvian) | Closed July 2026 (Nicki's CWE Guide). MapQuest also says permanently closed |
| Mango Peruvian | Yelp "CLOSED" (Aug 2026), DoorDash inactive |
| Mission / Session Taco | Fox 2 (Oct 13, 2026) reports all remaining locations closing this weekend |
| Nobu's, Olive Blvd | Closed. The Delmar location could not be verified for 2026 |
| Nippon Tei (Ballwin) | Yelp "CLOSED" (Apr 2026) |
| Everest Cafe (Nepali/Korean) | Closed Aug 2026 (STLPR) |
| Tai Ke, 8604 Olive | Old location closed |
| Texas de Brazil (Galleria) | Closed |
| Feasting Fox, Schneithorst's, Bevo Mill (German) | Closed. No German country was made |

### At risk or unverifiable

| Candidate | Reason |
| --- | --- |
| Maize & Wheat (Colombian) | St. Louis Magazine says it was slated to close Oct 17, 2026 (today) unless the lease was renegotiated. Too risky |
| Manileño (Filipino) | No 2026 evidence. A different business ("Pho Long Restaurant") is listed at its address, 3611 Juniata, on Yelp in Oct 2026 |
| Chez Ali (Senegalese) | DoorDash shows "temporarily closed". It was also the only Senegalese candidate |
| Zlatne Kapi (Bosnian bakery) | Only weak 2026 evidence from aggregators |
| Pho Long (Olive Blvd) | Open (Yelp Apr 2026, DoorDash Aug 2026), but older listings show two different addresses and the rating is 3.5. Dropped because Vietnam already had three stronger entries |

### Dropped because the country fell below 2 verified restaurants

- **Peru:** only Brasas (6138 Delmar, Yelp Aug 2026) survived after Cocina Latina and Mango closed. Los Incas is in O'Fallon (St. Charles County), outside the city-plus-county scope.
- **Nigeria:** only Levels Nigerian Cuisine (Yelp Jul 2026). Other West African spots are Ghanaian (now under Ghana) or Togolese (Fufu n' Sauce).
- **Taiwan:** only Tai Ke Shabu Shabu (Olivette, Yelp Sep 2026).
- **Turkey:** Sheesh (Yelp Aug 2026) and Aya Sofia (Yelp Sep 2026) are both open. Aya Sofia had no confirmed specific dish before the search budget ran out, so Turkey fell to one.
- **Colombia, Senegal, Syria, Iran, El Salvador, Venezuela:** one or zero verifiable candidates each:
  - Syria: Ranoush.
  - El Salvador: El Guanaco.
  - Venezuela: Salsa Rosada.

### Verified open but dropped (no specific dish confirmed before the search budget ran out)

These restaurants are all open and would be easy to add back:

- Taqueria El Bronco (2817 Cherokee)
- The Mexican STL (Crestwood)
- Pastaria (Clayton)
- Rasoi (25 N Euclid)
- Kaslik (Hazelwood)
- Kimchi Guys (Laclede's Landing)
- Aya Sofia
- Sheesh
- Brasas
- Levels
- Tai Ke Shabu Shabu

## Judgment calls

### Country assignments

- **Mosob** describes itself as Eritrean & Ethiopian. It is filed under Ethiopia. Its dish (zigni) is Eritrean.
- **Ghana:** House of Jollof's owners are from Ghana. Africana is run by the same owners and serves West African food, including Ghanaian waakye, plus East African dishes.
- **Nepal:** Himalayan Yeti and Himalayan Hut have Indian/Nepali menus, and Yelp files them as Indian + Himalayan/Nepalese. They are placed under Nepal and their recommended dishes are momos. India uses Turmeric and House of India instead.
- **The Vine** describes its food as Lebanese, Palestinian and Iraqi. It is filed under Lebanon.
- **Balkan Treat Box** is categorized as "Turkish" on Yelp. It is filed under Bosnia because the owners are Bosnian and it is widely covered as a Bosnian restaurant.
- **Korean Food Mart** shares its address with the "Café Ganadara" Yelp listing (Sep 2026). STL Mag and Hoodline (March 2026) report that the Parks merged Café Ganadara and Chicken Seven into the Korean Food Mart concept. The name used is Korean Food Mart.

### Dining style

- **Fast Casual** (counter ordering, eat in):
  - Balkan Treat Box (described as counter service)
  - Mestiza (Infatuation: counter-service)
  - Nudo House
  - The Fattened Caf
  - Taste of Lebanon
  - Irie Eats
- **Takeout / Counter** (takeout-first, walk-up or cafeteria):
  - Taste of Bosnia
  - Gioia's Deli
  - Gyro Company
  - Caribbean Delight (cash-only walk-up)
  - Mi Hungry (cafeteria-style)
  - Korean Food Mart (takeout-first)
- **Upscale Sit-Down:** Sado and Charlie Gitto's.

### Price tiers

- Where Yelp's price level appeared in results, it was used: Fork & Stix, Spiro's, Olympia, Gyro Company, Zia's and Seoul Garden.
- Sado is `$$$$` because it is an omakase/sushi destination. Charlie Gitto's is `$$$`.
- The other tiers are judgment calls from format: counters and delis are `$` and most sit-down spots are `$$`.

### Neighborhoods

- 3210 S Grand (Meskerem) and 3212 S Grand (Brasilia) are on the east side of Grand: Tower Grove East.
- 3201 (Eat Today), 3195 (Grand Bistro) and 3171 (The Vine) are on the west side: Tower Grove South.
- The Fattened Caf uses "Benton Park West", following The Infatuation; it is just off Cherokee Street.
- **Unincorporated county addresses:**
  - Berix: "Lemay".
  - Taste of Bosnia: "Mehlville", per Apple Maps.
- **University City:**
  - House of India (8501 Delmar, ZIP 63124) and Irie Eats (8428 Olive, ZIP 63132) are labeled University City, following the Explore UCity and ForTheCultureSTL listings.
- Himalayan Hut has a Webster Groves mailing address but sits in Rock Hill, per its own site.

### Recommended-dish caveats

- Several dishes rest on thinner evidence: a headline or general praise rather than a named menu item.
  - Mestiza: "tacos".
  - Sado: sushi, from the RFT "best sushi" piece.
  - Menya Rui: house-made-noodle ramen.
  - Seoul Garden: tabletop BBQ.
  - House of India: dal and naan, from a Sauce editor's recommendation.
- The rest come from named menu items or reviews in the results.

### Weaker status evidence (open, but older than the others)

- **The Vine:** latest Yelp evidence is Feb 2026, plus a Wheree update in Mar 2026.
- **Africana:** Yelp search snapshots May–Sep 2026. Apple Maps oddly shows "Opening Soon".
- **Seoul Garden:** the page is titled "Updated October 2026" but the body says "over 3 months ago".
