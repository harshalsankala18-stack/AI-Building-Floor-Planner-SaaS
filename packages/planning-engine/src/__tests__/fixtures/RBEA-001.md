# RBEA-001 Professional Reference Normalization

## Purpose and evidence boundary

Redacted, test-only normalization of two visually inspected professional residential/farmhouse sheets: Ground and First Floor. The fixture is not consumed by generation, repair, scoring, rendering or projection. The original inline benchmark remains unchanged.

Identity is Professional Reference 001 / RBEA-001. Professional acceptance is USER_REPORTED; REFERENCE_ACCEPTED_BY_PRACTICE does not validate software output, compliance or construction readiness. No original drawing, title block, source path, personal identifiers or historical coordinates are stored.

## SOURCE_VERIFIED_FACTS

One road is shown along the lower page edge; farm context surrounds the other sides of the developed enclosure. Main Gate connects the road to continuous open paving and the garage/porch route. Wicket Gate is at the opposite enclosure edge beside the garage; a direct road-to-wicket route is not shown. Two cars and one motorcycle are drawn in the garage. Landscape borders, two lawn portions and a gazebo are intentional site elements.

Ground has two bedrooms; First has three. Seven bathrooms are visible: three Ground and four First. The Ground Pooja is a labelled common-hall niche, not a separately enclosed room. Stair and common distribution are visibly identifiable but are not independently named rooms in the drawing.

All inventory facts below are VERIFIED_FROM_SOURCE. Null canonical types avoid inventing production types for combined halls, niches, voids and site elements. All dimensions in this table are REFERENCE_EVIDENCE_ONLY, feet/inches, with the corresponding source sheet in the fixture. A dash means no complete room-label dimension pair retained; it does not mean the drawing has no dimension annotations.

### Ground inventory (sheet 1)

| Semantic ID | Source label / observed element | Category; canonical type / zone | Reference size | Access and exposure evidence |
|---|---|---|---|---|
| ground_living | LIVING | interior; Living / Public | 17'-0" x 20'-1.5" | Veranda door, open inner distribution; W |
| ground_kitchen_dining_family | KITCHEN CUM DINNING CUM FAMILY HALL | functional_cluster; null / SemiPublic | 29'-4.5" x 14'-0" | Combined open uses; Store and Utility doors; W |
| ground_store | STORE | interior; Storage / Service | 13'-0" x 5'-0" | Door from combined hall; W |
| ground_pooja | POOJA | functional_cluster; Pooja / Private | - | Niche in common hall; no enclosed-room door asserted |
| ground_parents | PARENTS BED | interior; Bedroom / Private | 15'-0" x 13'-3" | Common entry and own bath from bedroom recess; W |
| ground_parents_bath | ATTACH | interior; Bathroom / Service | 5'-0" x 9'-0" | Door from Parents bedroom entry recess; V |
| ground_master_01 | MASTER BED 01 | interior; Bedroom / Private | 13'-0" x 17'-0" | Common entry, Dressing door; W |
| ground_dressing | DRESSING | interior; null / Private | 8'-0" x 7'-4.5" | Bedroom-to-bath intermediary |
| ground_master_bath | MASTER BATH | interior; Bathroom / Service | 8'-0" x 5'-6" | Door from Dressing; V |
| ground_common_bath | COMMON ATTACH | interior; Bathroom / Service | 9'-0" x 5'-0" | Common-side door; V; ownership ambiguous |
| ground_circulation | Unlabelled common distribution | transition; null / Circulation | - | Continuous common floor around stair/skylight |
| ground_stair | Drawn flights / numbered treads | core; Staircase / Circulation | - | Common access; W |
| ground_skylight | SKYLIGHT | infrastructure_reservation; null / Circulation | - | Common core annotation, not an occupiable room |
| ground_utility | UTILITY | outdoor; Utility / Service | - | External paved strip, site steps, combined-hall door |
| ground_stove | SPACE FOR STOVE | outdoor; null / Service | - | External service area adjoining utility |
| ground_veranda | VERANDA | transition; null / Circulation | - | Raised semi-open Living threshold |
| ground_porch | PORCH | transition; null / Circulation | - | Semi-open arrival beside veranda and steps |
| ground_garage | GARAGE | access; Parking / Outdoor | - | Site paving access, RS tag, vehicles |
| ground_gazebo | GAZEBO | outdoor; null / Outdoor | 10'-0" x 10'-0" | Seating pavilion and steps within lawn |
| ground_lawn | LAWN | outdoor; Garden / Outdoor | - | Two labelled portions grouped semantically |
| ground_landscape | Planted border, unlabelled | outdoor; null / Outdoor | - | Perimeter plant symbols |
| ground_paving | Open paving, unlabelled | access; null / Outdoor | - | Connected gate-garage-porch route |
| ground_main_gate | MAIN GATE | access; null / Outdoor | - | Road to paving |
| ground_wicket | WICKET GATE | access; null / Outdoor | - | Paving to opposite edge/farm context |

### First Floor inventory (sheet 2)

| Semantic ID | Source label / observed element | Category; canonical type / zone | Reference size | Access and exposure evidence |
|---|---|---|---|---|
| first_master_02 | MASTER BED 02 | interior; Bedroom / Private | 13'-0" x 17'-0" | Common entry; private bath; W |
| first_master_03 | MASTER BED 03 | interior; Bedroom / Private | 14'-0" x 13'-3" | Common entry, bath, FD to Balcony; W |
| first_guest | GUEST BED | interior; Bedroom / Private | 13'-0" x 14'-0" | Common entry, own bath via bedroom entry bay; W |
| first_bath_02 | ATTACH | interior; Bathroom / Service | 5'-0" x 9'-0" | Master 02 entry area door; V |
| first_bath_03 | ATTACH | interior; Bathroom / Service | 5'-0" x 9'-0" | Master 03 entry area door; V |
| first_guest_bath | ATTACH | interior; Bathroom / Service | 9'-0" x 5'-0" | Guest bedroom entry bay door; V |
| first_common_bath | COMMON ATTACH | interior; Bathroom / Service | 9'-0" x 5'-0" | Common-side door; V; ownership ambiguous |
| first_family | FAMILY SEATING | interior; Living / SemiPublic | 16'-9" x 11'-4.5" | Open distribution and FD to Sit Out |
| first_circulation | Unlabelled common distribution | transition; null / Circulation | - | Stair arrival to bedrooms/common bath/terrace |
| first_stair | Drawn flights / numbered treads | core; Staircase / Circulation | - | Corresponding Ground core; W |
| first_skylight | SKYLIGHT | infrastructure_reservation; null / Circulation | - | Corresponding common-core annotation |
| first_living_void | BELOW LIVING | infrastructure_reservation; null / Public | - | Open-to-below area, not an upper Living room |
| first_balcony | BALCONY | outdoor; Balcony / Outdoor | - | FD from Master 03 |
| first_sitout | SIT OUT | outdoor; null / Outdoor | - | FD from Family Seating |
| first_terrace | PARTLY COVERED TERRACE | outdoor; Terrace / Outdoor | - | FD from stair-side common circulation |

## Bathroom topology and ownership

| Bedroom | Bathroom | Direct door | Intermediate path | Common bath access | Association evidence |
|---|---|---|---|---|---|
| Parents Bed | Ground ATTACH | Yes, from its entry recess | No separate space | No | Visible private bedroom-side access |
| Master Bed 01 | Master Bath | No | Master 01 -> Dressing -> Master Bath | No | Visible suite path |
| Master Bed 02 | First ATTACH 02 | Yes, from bedroom entry area | No separate space | No | Visible private bedroom-side access |
| Master Bed 03 | First ATTACH 03 | Yes, from bedroom entry area | No separate space | No | Visible private bedroom-side access |
| Guest Bed | First Guest ATTACH | Yes, from bedroom entry bay | Bay is inside bedroom boundary | No | Visible private bedroom-side access |

These five associations use VERIFIED_SUITE_ASSOCIATION with VISIBLE_SUITE_ACCESS evidence. Ownership is not inferred from list order or adjacency. Both COMMON ATTACH bathrooms have common-side doors, no assigned bedroom owner, and AMBIGUOUS ownership. Bedroom entry recesses are included in their rooms; they are not separately labelled dressing rooms.

Parents Bed is verified on Ground for this project. A universal Ground-floor rule is not asserted.

## Arrival, service and site topology

- Road -> Main Gate -> open paving -> Garage.
- Road -> Main Gate -> open paving -> Porch -> Veranda -> Living -> common distribution.
- Ground common distribution connects bedrooms, stair and combined hall.
- First Stair -> common distribution -> Family Seating; bedrooms and common bath branch from common space.
- Combined Kitchen/Dining/Family Hall opens to Store and Utility; Pooja is a niche in that hall.
- Site paving also reaches the external Utility by steps.
- Normal common arrival does not require unrelated private-bedroom transit.

Garage roof/enclosure engineering and vehicle turning performance are not evaluated. Lawn, gazebo, landscape, porch, veranda, utility, terrace, sit-out, balcony, paving and voids are intentional non-room or transition semantics, never automatic dead-space classifications.

## Multi-floor evidence

Stair and skylight correspond across the sheets: VERIFIED_ARCHITECTURAL_COORDINATION. BELOW LIVING establishes an upper void above Ground Living. Upper enclosure and outdoor/void configuration are not a uniformly scaled rectangle. Repeated common-bath/service-edge positions and lower suite wet-area zones show architectural coordination with changed partitions, not exact risers, pipe routing, structural alignment or load paths.

## Openings, exposure and furnishings

D, W and V tags are visible on both sheets. FD occurs at upper terrace, balcony and sit-out openings. RS appears at Garage. No source schedule expands FD or RS, so both specific meanings remain AMBIGUOUS; RBEA-003's FD expansion is not imported.

W evidence exists at all five bedrooms, Ground Living, combined hall, Store and stair. V tags serve all seven bathrooms. Shared service-edge windows/vents face the external Utility strip. These are exposure opportunities, not daylight or ventilation compliance.

Visible furnishings include beds, wardrobes, sofas/tables, TV units, dining table, kitchen counter/sink/hob, sanitary fixtures, two cars, one motorcycle and gazebo seating. No furniture or vehicle solver is implied. Pooja retains canonical Private with CANONICAL_ZONE_CLASSIFICATION_LIMITATION: the observed niche is associated with common space.

## ASSERTED_INTERPRETATIONS / GENERALIZABLE_CANDIDATES

Arrival hierarchy, combined common/service use, suite-path distinctions, common bedroom distribution, core/void coordination, outdoor program and exterior-opening opportunities are candidates for later comparison. Their interpretive provenance is ASSERTED_FROM_BRIEF and invariant strength is NOT_ASSIGNED. No architectural invariant is decided here.

## PROJECT_SPECIFIC_OBSERVATIONS

Five-bedroom distribution; Parents and Master 01 on Ground; exact room sizes and positions; seven baths; common-hall niche; garage/farm setting; gate locations; lawn/gazebo arrangement; upper void and outdoor configuration. These are not global placement rules.

## AMBIGUOUS_ITEMS

Exclusive ownership of COMMON ATTACH; FD/RS expansions; reliable cardinal mapping; external route beyond Wicket; dimension chains; exact skylight construction, roof coverage, plumbing risers and vehicle maneuvering. No source contact, title block, drawing identifier or coordinates are retained.

## Existing inline benchmark comparison

The seed-20260904 benchmark in program-intent.test.ts stays unchanged.

| Category | Classification | Exact gap |
|---|---|---|
| Project/program | PARTIAL | G+1 and five bedrooms match; combined hall is split into Kitchen/Dining and lacks explicit Family Hall |
| Floor intent | MATCHES_SOURCE | Parents/Master 01 Ground, Masters 02/03 and Guest First; Ground Pooja |
| Room inventory | PARTIAL | Seven source baths vs five benchmark baths; Parents bath, upper common bath, Dressing, Store and numerous common/site elements missing |
| Bath ownership | PARTIAL | Four supplied pairs match source associations; Parents suite absent; common baths unowned |
| Physical bath topology | PARTIAL | At-least-three-of-four direct-door target is a software assertion; source Master 01 uses Dressing and is not a direct edge |
| Dimensions | CONTRADICTS_SOURCE | Synthetic 22000 x 28000 mm site and 20000 x 25500 mm footprint are not the drawing's dimensions; room areas come from the catalog |
| Adjacency | PARTIAL | Owner graph assertions do not encode full arrival/service/suite topology |
| Kitchen/service | PARTIAL | Kitchen/Dining/Utility included; Store, combined Family Hall and Stove area absent |
| Site/outdoor | PARTIAL | Garage/Balcony included; farm context, landscaping, gazebo, gates, paving, porch/veranda, terrace and sit-out absent |
| Parking/access | PARTIAL | Garage item exists without gate-driveway chain or vehicle evidence |
| Stair/core | PARTIAL | Stair exists; Skylight and BELOW LIVING void absent |
| Reduced upper floor | PARTIAL | Synthetic 75-percent scale parameter does not encode the source nonuniform plate, void and terraces |
| Openings/exposure | MISSING_FROM_INLINE_BENCHMARK | No source-specific opening or exterior-exposure assertions |

The benchmark asserts required Ground rooms, four owned pairs on the same floors, valid candidates and at least three direct doors in the best candidate. It uses fixed synthetic setbacks, footprint position and scale assumptions; those are not copied into this reference fixture. Its North-facing input is not treated as verified source orientation here. No comparison gap is repaired during normalization.

## Deferred technical debt

LEGACY_BATH_OWNERSHIP_FALLBACK_DEBT remains: ownerless legacy Attached Bath items may be paired by list order in graph/builder.ts. Explicit owners remain supported. Documentation maturity overclaims remain unchanged. No changes to production, the existing benchmark, other references or their terminology.
