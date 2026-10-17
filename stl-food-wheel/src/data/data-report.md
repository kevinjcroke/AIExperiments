# Restaurant data report — 2026-10-17

## Summary

- **Current dataset (after the merge of user research, see the last section): 24 countries, 72 restaurants.**
- Every restaurant has `lastVerified: "2026-10-17"`.
- **Dining styles:** 49 Casual Sit-Down, 12 Fast Casual, 7 Takeout / Counter, 4 Upscale Sit-Down.
- **Prices:** 18 × `$`, 48 × `$$`, 5 × `$$$`, 1 × `$$$$`.
- **Wheel order:** Bosnia, Thailand, Mexico, Ethiopia, France, Japan, Italy, Afghanistan, Peru, Philippines, Brazil, India, Germany, Jamaica, Vietnam, Greece, Cuba, Ghana, Korea, Nigeria, Lebanon, Nepal, Turkey, China.
- The original pass (before the merge) produced 18 countries and 44 restaurants. The sections below, up to "Merge of user research", describe that pass and are kept as they were.

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

## Merge of user research (2026-10-17)

The user supplied a research list of 25 countries. It had name, address, neighborhood, style, price and dish, but no coordinates, sources or ids. I treated it as candidate research under the same rules as the original pass: every added restaurant needed 2026 evidence that it is open, plus coordinates from a real listing.

- The list's `flagEmoji` fields were not carried over. The dataset uses `isoCode` only, and a check confirmed no `flagEmoji` field and no regional-indicator characters in `restaurants.json`.
- The user's `south_korea` id was mapped to the existing `korea`.
- All 44 previously verified entries were kept and not re-verified.
- **Method:** WebSearch only. WebFetch still fails DNS, and outbound curl, including to geocoders, gets a proxy 403. Coordinates come from listing structured data shown in search results.

### Result

- **24 countries, 72 restaurants.** This is 28 more restaurants and 6 new countries.
- The 25-country cap was not reached because 3 of the user's 9 new countries did not get 2 verified restaurants.
- **New countries:**
  - Turkey (`tr`)
  - Nigeria (`ng`)
  - Peru (`pe`)
  - France (`fr`)
  - Germany (`de`)
  - Cuba (`cu`)
- **Countries dropped:**

| Country | Reason |
| --- | --- |
| Taiwan | Tai Ke Shabu Shabu is open (Yelp Sep 2026, categorized Taiwanese) but is the only one. Corner 17 is filed as Chinese on Yelp (Oct 2026), so it stays under China. |
| Senegal | Chez Ali is still unclear (see conflicts). JSK Jollof Sénégal Kitchen (12667 New Halls Ferry Rd, Florissant) could not be found in any listing, so it is unverifiable. |
| Argentina | Asador del Sur is Uruguayan and Ecuadorian, not Argentine, per Ladue News: "Serves Cuisine of Uruguay and Ecuador" (owners from those countries; OpenTable lists it as Latin American). That leaves only TANGO Argentina Food, which is open (2418 W Clay St, St. Charles; coordinates 38.7849, -90.5107). |

- **Wheel order:** the 18 existing countries keep their relative order. The new ones were placed so that similar regions are not adjacent:
  - France sits between Ethiopia and Japan.
  - Peru sits between Afghanistan and the Philippines, away from Brazil.
  - Germany sits between India and Jamaica.
  - Cuba sits between Greece and Ghana, away from Jamaica and Mexico.
  - Nigeria sits between Korea and Lebanon, away from Ghana.
  - Turkey sits between Nepal and China, away from Greece and Lebanon.

### Restaurants added (28)

| Country | Added | Status evidence (sourceUrl) | Coordinates from |
| --- | --- | --- | --- |
| Bosnia | Zlatno Zito Bakery & Deli | Yelp May 2026 | MapQuest, Tripadvisor, Postmates |
| Thailand | Chiang Mai | Yelp Oct 2026 | DoorDash, Tripadvisor |
| Mexico | Taqueria El Bronco | Yelp Oct 2026 | usarestaurants, Wanderboat, Nextdoor |
| Mexico | Fonda La Poblanita | Yelp Jul 2026 | DoorDash, Restaurant Guru, Uber Eats |
| Japan | Indo | Yelp Aug 2026 | Tripadvisor, Lewis & Clark Trail |
| Italy | Trattoria Marcella | Yelp Sep 2026 | Waze, AAA, Nextdoor, Tripadvisor |
| Vietnam | Truc Lam | Yelp Jul 2026 | Waze, Restaurant Guru, Tripadvisor |
| Vietnam | DD Mau Vietnamese Eatery | Yelp Oct 2026 | Tripadvisor, Uber Eats, Wanderboat |
| Korea | Joo Joo Restaurant & Karaoke | Yelp Korean search page Jul 2026 | Checkle, KaraokeLocations |
| Korea | Sides of Seoul | Named in the 2026 STL 100 (its Facebook page) | DoorDash; Nextdoor latitude agrees |
| Korea | Kimchi Guys | Yelp Korean-chicken search page 2026 (4.0, 252 reviews) | Tripadvisor, Restaurant Guru, Playeasy |
| China | ChiliSpot | Yelp Aug 2026 | Waze, Tripadvisor, Restaurant Guru |
| China | Soup Dumplings STL | Yelp Oct 2026 | Roadtrippers, Wanderboat, Restaurant Guru |
| India | Rasoi | Yelp Sep/Oct 2026 | Official site, MapQuest, Tripadvisor |
| India | Anis Hyderabad House | Yelp Aug 2026 | latlong.net, ATLY, Orderspoon |
| Greece | Anthonino's Taverna | Yelp Oct 2026 | MapQuest, Waze, Tripadvisor, Food Network |
| Turkey | Sheesh Restaurant | Yelp Sep 2026 | Postmates, Wanderboat, Roadtrippers |
| Turkey | Aya Sofia | OpenTable "Updated 2026" (earlier pass also saw Yelp Sep 2026) | MapQuest, OpenTable, Tripadvisor, Waze |
| Nigeria | Levels Nigerian Cuisine | Yelp Jul 2026, Tripadvisor review Mar 2026 | Atlas Obscura, Tripadvisor |
| Nigeria | African Palace Bar & Grill | DoorDash review dated 7/19/26 | Roadtrippers, Tripadvisor |
| Peru | Jalea (St. Charles) | Yelp Sep/Oct 2026 | OpenTable, Lewis & Clark Trail |
| Peru | Brasas | Yelp Aug 2026 | MapQuest only |
| France | Brasserie by Niche | Yelp Jul/Sep 2026 | joe.coffee, Tripadvisor |
| France | Café Provençal | Yelp French search page Oct 2026 | Waze, Nextdoor, Tripadvisor, MapQuest |
| Germany | Das Bevo | Yelp Sep 2026, plus an STLPR-listed event on May 8, 2026 | OpenTable, Tripadvisor, Feverup |
| Germany | Urban Chestnut Grove Bierhall | Yelp Sep 2026 | Nextdoor only |
| Cuba | Havana's Cuisine | Yelp Sep 2026 | MapQuest, Waze, Infatuation, Tripadvisor |
| Cuba | Mayo Ketchup | Yelp Oct 2026 | DoorDash, Uber Eats |

**Single-source coordinates:**
- Brasas: MapQuest. It sits plausibly between Africana (5860 Delmar) and the Loop.
- Urban Chestnut Grove: Nextdoor. It sits plausibly west of Sameem (4341 Manchester).

**MapQuest quirk:** MapQuest's coordinates for Sheesh (38.598464, -90.242672) are identical to the existing Brasilia entry, which was single-sourced from MapQuest. The two are three doors apart on S Grand (3212 and 3226), so the error is negligible. Sheesh uses the Postmates/Wanderboat cluster instead.

### Conflicts with user research (left out; please show the user)

| User-listed restaurant | Evidence | Date |
| --- | --- | --- |
| Al-Tarboush Deli (Lebanon) | The earlier pass found Yelp marked it "CLOSED" (Aug 2026). The re-check found no newer evidence of it operating, only undated listings (Riverfront Times, Wanderlog). | Yelp CLOSED, Aug 2026 |
| Everest Cafe & Bar (Nepal) | St. Louis Public Radio, Aug 24, 2026: closed Friday, Aug 21, 2026, after 22 years. | Aug 21, 2026 |
| Chez Ali (Senegal) | The earlier pass saw DoorDash "temporarily closed". The re-check found no 2026 evidence: City Foundry/St. Louis American coverage is undated or from 2021–2022, with no current Yelp page or reopening news. Still unclear. | — |
| Haveli Indian Restaurant (India) | Yelp page titled "HAVELI INDIAN RESTAURANT - CLOSED - Updated June 2026". Tripadvisor and Restaurantji also show CLOSED, Wanderlog says permanently closed, and DoorDash says not active. The user's address was also off (see corrections). | Yelp CLOSED, Jun 2026 |
| El Molino del Sureste (Mexico) | DoorDash shows "Temporarily closed" (undated). No 2026 Yelp business page was found, the newest status signal is Wheree (May 2026) and an Explore St. Louis listing, and no closure news exists. Status unclear, so it was left out. | — |
| JSK Jollof Sénégal Kitchen (Senegal) | No listing found anywhere (Yelp, DoorDash, directories). Unverifiable. | — |

**Das Bevo vs. the earlier report:** the earlier report listed "Bevo Mill (German)" as closed. That appears to refer to the original Bevo Mill restaurant, which closed in 2009. Das Bevo, the current restaurant and beer hall in the same windmill, is open: Yelp Sep 2026, a May 2026 event, and a current official menu. Das Bevo is therefore included. Feasting Fox and Schneithorst's remain closed.

### Address and name corrections

- **Sultan Mediterranean:** the user had 4160 Manchester Ave. Every source (Yelp Jul 2026, Infatuation, Tripadvisor) gives **4200 Manchester Ave**. It was not added anyway (see judgment calls).
- **Haveli:** the user had "9720 Page Ave, St. Ann, MO 63114". Listings give **9720 Page Ave, St. Louis, MO 63132**, in the Overland area. It is closed anyway.
- **"De African Palace Bar & Grill"** is listed everywhere as **African Palace** or **African Palace Bar & Grill**. The second name is used. The address (4005 Seven Hills Dr, Florissant) is correct.
- **"Chili Spot"** is styled **ChiliSpot** on Yelp and Tripadvisor.
- **Corner 17:** the user placed it under Taiwan. Yelp categorizes it as Chinese, so the existing China entry is unchanged.
- **Mayo Ketchup:** it moved from 2001 Park Ave (Lafayette Square) to **3135 Olive St** (Midtown, the former Salsa Rosada space). The user's address is the current one.
- Havana's Cuisine moved to 12 S Euclid in Nov 2024 (older listings show 1131 Washington Ave). The user's address is correct.
- TANGO Argentina Food's older Campus Dr listings are outdated, and 2418 W Clay St is correct. It was not added because Argentina was dropped.
- **Price corrections:**
  - Aya Sofia: the user had `$$$`. It is set to `$$` (Yelp `$$`, OpenTable "$30 and under").
  - Sides of Seoul: the user had "Fast Casual". It is set to "Takeout / Counter" because multiple sources say it is take-out only.

### Dish handling

**Dishes corroborated by menu or review evidence** (the user's dish plus at least one other source):
- Chiang Mai: sai oua (Toast menu, Ladue News).
- El Bronco: al pastor.
- Fonda La Poblanita: Machete.
- Indo: Isaan hamachi.
- Trattoria Marcella: osso buco.
- DD Mau: lemongrass pork bánh mì (Feast).
- Joo Joo: haemul pajeon (Feast recipe feature).
- Sides of Seoul: spicy pork kimbap (delivery menus).
- Kimchi Guys: honey butter sauce (STL Mag).
- Soup Dumplings STL: crab and pork.
- Rasoi: chicken tikka masala.
- Anis: goat dum biryani.
- Anthonino's: spanakopita.
- Sheesh: Adana (Yelp popular dishes).
- Aya Sofia: Sultan's Delight (menu).
- Levels: Party Jollof with signature goat.
- African Palace: egusi (DoorDash review).
- Jalea: classic ceviche (Feast, STL Mag 2022; the current menu also shows a mixto).
- Brasas: rotisserie chicken.
- Brasserie by Niche: steak frites (official menu).
- Café Provençal: onion soup.
- Urban Chestnut: currywurst (2023 menu PDF).
- Havana's: Cuban sandwich.
- Mayo Ketchup: ropa vieja bowl.

**Dishes from user research that are not independently corroborated** (kept, but treat as weaker):
- **Zlatno Zito:** burek. The bakery is praised for Bosnian food, but no source names its burek specifically.
- **Truc Lam:** phở tái bò viên. Its pho is widely praised, but the exact rare beef and meatball combination was not confirmed on its menu.
- **ChiliSpot:** Chongqing spicy chicken (la zi ji). Yelp's popular dishes show "Chongqing Popcorn Chicken", which may or may not be the same item.

**Dishes adjusted from the user's version:**
- **Das Bevo:** the user had "Bavarian Bratwurst Plate". The official menu has a "Loaded Wurst" (G&W bratwurst) and a "Schnitzel Plate", and those are used.
- **African Palace:** the user had "Egusi Soup with Pounded Yam". The 2026 review mentions egusi with fufu, so it is written as "with fufu".
- **Trattoria Marcella:** the user had "with Risotto Milanese". A reviewer describes the osso buco on butternut squash polenta, so the side was left out.

**Existing entries where the user's dish differed:** kept the existing dish unless noted.

| Restaurant | Existing (kept) | User's dish |
| --- | --- | --- |
| Menya Rui | **Updated** to "Pork shoyu ramen". The user's "Original Shoyu Ramen" is more specific, and STL Mag, Feast and RFT confirm the pork shoyu is the best seller. | Original Shoyu Ramen |
| Sado | Sushi (RFT best sushi) | Chef's Nigiri Omakase. Time Out praises the nigiri, but the current omakase format and price were not confirmed. |
| Balkan Treat Box | Pide | Wood-Fired Beef Pide (consistent) |
| Berix | Meat burek | Ćevapi with Somun and Kajmak |
| Fork & Stix | Hung Lay curry | Khao Soi |
| Zia's | Seafood ravioli | Spedini di Pollo |
| Mai Lee | Phở tái | Phở Đặc Biệt |
| The Vine | Lebanese nachos | Chicken Shawarma Sandwich |
| Kain Tayo | Sisig | Chicken Inasal |
| The Fattened Caf | Piyanggang chicken | Filipino BBQ Pork Skewers Plate |
| Spiro's | Lamb shank | Greek Broiled Rack of Lamb |
| Yemanja Brasil | Feijoada | Moqueca de Peixe |
| Brasilia | Feijoada | Picanha na Chapa |
| Himalayan Yeti | Momos and goat curry | Himalayan Goat Curry (consistent) |
| Cate Zone | Pork belly noodles | Crispy Sweet and Sour Pork |
| Corner 17 | Hand-shaved noodles | Hand-Pulled Crispy Chili Beef Noodles |

The user's list matched the existing dishes for Charlie Gitto's (toasted ravioli), King & I (King Platter), Sameem, Afghan Kabob House, Olympia, Meskerem and Eat Today.

### Judgment calls

- **Indo → Japan.** Indo is a Thai-Japanese hybrid; Yelp lists it as Pan Asian and Resy as Southeast Asian. The user filed it under Japan and the dish is Isaan (Thai) hamachi. It was kept under Japan per the user's list, and Japan's other entries (Sado, Menya Rui) are pure Japanese. It could equally be moved to Thailand.
- **Mayo Ketchup → Cuba.** Yelp categorizes it as Dominican, and press describes a Puerto Rican, Cuban and Dominican menu. It was kept under Cuba because its best-selling dish is a Cuban-style ropa vieja and it serves an "El Cubano". Cuba's other entry, Havana's Cuisine, is unambiguously Cuban.
- **Urban Chestnut Grove Bierhall → Germany.** It is a brewery bierhall, filed on Yelp as Breweries. The food is pizza plus German items: currywurst, Zwickel brats and pommes frites. It is included because the German dishes are long-running. MapQuest has a CLOSED tag on a "Tesla Destination" entry at this address; that is an EV-charger listing, not the bierhall.
- **Das Bevo** is filed on OpenTable as "American" and on Yelp as Venues & Event Spaces. It is a German beer hall in the Bevo windmill with a German menu.
- **Sultan Mediterranean was not added to Turkey.** It is open (Yelp Jul 2026, at 4200 Manchester) but describes its food as Kurdish ("the cuisine of Kurdistan and beyond"). Labeling it Turkish would be inaccurate, and Turkey already has two verified Turkish restaurants.
- **Sheesh** is run by an Iraqi family who lived in Turkey. Yelp, Feast and STL Mag all describe it as Turkish, so it is kept under Turkey.
- **Anthonino's Taverna** serves Greek and Italian food on The Hill. Yelp's primary category is Greek, and the dish is Greek.
- **St. Charles County is in scope.** Jalea (St. Charles) was added, and the schema bounds cover it.
- **Restaurants in the earlier "verified open but dropped" list:**
  - Added with the user's dishes: El Bronco, Rasoi, Kimchi Guys, Aya Sofia, Sheesh, Brasas and Levels. None had coordinates recorded in the earlier report, so all were sourced fresh.
  - Tai Ke: verified again (Yelp Sep 2026), but Taiwan has only one restaurant, so it was not added.
