# RBEA-002 Professional Reference Fixture

## Purpose and evidence boundary

This redacted fixture combines visually audited source facts with the user-supplied brief's generalized relationship expectations. It is test-only and is not consumed by candidate generation, scoring, repair, ranking, rendering, or 3D projection.

All three original plan sheets were visually inspected, including enlarged master-suite, common-bath, upper-floor and kitchen/family details. Sheet 1 is Ground, sheet 2 is First Floor, and sheet 3 is Second Floor. The source and its identifying title blocks are not stored here.

Evidence provenance distinguishes `VERIFIED_FROM_SOURCE`, `ASSERTED_FROM_BRIEF`, and `AMBIGUOUS`. Legacy confidence `ASSERTED` is not a substitute for provenance. Room existence, legible dimension pairs, opening symbols, furniture and visible access topology are source-verified. Generalized relationship strengths remain interpretations from the brief unless separately supported in `sourceAudit`; they are not universal requirements printed on the drawing.

`REFERENCE_ACCEPTED_BY_PRACTICE` is user-reported provenance. It does not mean this software or any generated plan has received professional validation.

## Scope

- Ground floor: mixed-use context only—four shops, parking/access, residential lobby/core, borewell reservation and paving.
- First floor: primary active residential reference.
- Second floor: active partial residential reference with reduced enclosed plate and terrace.
- Production generator scope remains residential only.

## Generalizable evidence

- Shops seek direct public/street frontage without customer transit through the private residential lobby.
- Vehicle frontage, gate, drivable/open access and parking form one arrival chain.
- Pedestrian frontage, wicket and residential lobby form a separate arrival chain.
- Kitchen–dining/family and kitchen–utility are strong service relationships.
- Master bedroom, dressing and master bathroom form a suite cluster. Both upper sheets show bedroom entry into the dressing/access bay and the master-bath door from that bay, not a separate direct bedroom-to-bath opening.
- Lobby/common areas are intentional transition and distribution spaces, not automatic waste.
- Bedroom access should avoid compulsory transit through unrelated bedrooms.
- Living–garden terrace and dining/family–pooja are meaningful relationships.
- Stair and lift cores coordinate vertically across the three floors.
- Reduced upper plates and intentional terraces are valid multi-floor characteristics.
- Outdoor, infrastructure and access areas are not ordinary rooms or automatic dead space.
- Wet/service coordination, exterior opportunities and furnishability are evidence for later evaluators—not implemented claims.

## Project-specific observations—not global rules

Two 9 m roads, four shops, two represented car positions and two represented two-wheeler positions belong to this reference. Reported page positions for shops, parking, stair, master bedroom, kitchen and garden terrace are not generator rules and are not encoded as coordinates.

## Explicit uncertainty

- No cardinal road mapping is inferred from page position.
- Utility, circulation, stairs, balconies and irregular upper terrace do not receive inferred paired room dimensions from dimension chains. Ground commercial/context sizes are outside the selected residential dimension subset.
- “Common/attach” opens toward common circulation on sheet 2; the neighboring bedroom has a separate opening. Exclusive ownership remains ambiguous despite the label.
- Precise plumbing risers and structural alignment remain unverified; visible repeating wet/core zones establish architectural coordination only.
- `FD` remains `unknown_specific_opening_type`.
- No daylight, ventilation, furniture, parking, fire, structural, plumbing, mixed-use-generation or compliance engine is implied.

## Source-audit corrections

- Both roads are labelled 9 m; four shops, two car symbols, two two-wheeler symbols, remaining plot, borewell reservation, main gate and wicket gate are visible on sheet 1.
- Street-facing shop entries and the residential gate/lobby route are distinct. Internal service/access connections also exist, so complete commercial/residential physical isolation is not claimed.
- A separate ATTACH bathroom opens directly into the children's bedroom on each upper floor. These are now distinct fixture spaces, separate from the master bath and the first-floor COMMON ATTACH bathroom.
- The second-floor generic suite placeholders are replaced by labelled master bedroom, dressing, master bath, children's bedroom, attached bath, balcony and open distribution space.
- Stairs and lift continue in the same recognizable core zone across all three sheets. The second floor has a visibly reduced enclosed plate and a large labelled terrace.
- D, W, V and FD symbols are visible; FD has no expansion asserted. Beds/storage, seating/TV, dining table, kitchen counters/equipment and sanitary fixtures are visible.

## Master-suite and common-bath access

On both upper sheets: Master Bedroom -> Dressing/access bay -> Master Bath. The master-bath door is in the wall facing the dressing access bay; no direct bedroom-to-master-bath door is visible. This records suite association, not a mandatory direct-edge generator target.

Children's Bedroom -> its labelled ATTACH bathroom is a direct physical opening on both sheets. The first-floor COMMON ATTACH opens toward common circulation; ownership remains `AMBIGUOUS` rather than being assigned by proximity.

## Canonical Pooja zone

`CANONICAL_ZONE_CLASSIFICATION_LIMITATION`: canonical Pooja remains `Private`, consistent with existing core catalog semantics. Its visible door associates it with Dining/Family. Private classification is not evidence that visitors must pass through a bedroom. No production zone or zoning rule was changed.

## Verified dimension evidence

Every pair is stored as `REFERENCE_EVIDENCE_ONLY`, in feet/inches, with source sheet. These are neither universal minima nor generated coordinate/size acceptance targets.

| Space | First floor (sheet 2) | Second floor (sheet 3) |
|---|---|---|
| Master bedroom | 14'-1.5" x 12'-6" | 14'-1.5" x 12'-6" |
| Dressing | 10'-6" x 6'-0" | 10'-6" x 6'-0" |
| Master bath | 7'-4.5" x 5'-6" | 7'-4.5" x 5'-6" |
| Children's bedroom | 11'-0" x 14'-0" | 11'-0" x 13'-7.5" |
| Children's attach bath | 4'-0" x 11'-10.5" | 4'-0" x 11'-10.5" |
| Entrance lobby | 13'-9" x 8'-5.5" | 13'-9" x 5'-10" |
| Other bedroom | 10'-0" x 9'-0" | Not present in encoded upper inventory |
| Common/attach bath | 7'-6" x 4'-6" | Not present in encoded upper inventory |
| Kitchen | 11'-0" x 12'-10.5" | Not present in encoded upper inventory |
| Dining/family | 12'-9" x 11'-4.5" | Not present in encoded upper inventory |
| Living | 16'-3" x 17'-9" | Not present in encoded upper inventory |
| Pooja | 5'-0" x 8'-1.5" | Not present in encoded upper inventory |
| Garden terrace | 13'-9" x 14'-7.5" | Large irregular terrace; no paired room dimension stored |

## RBEA-001 comparison

RBEA-001 exists only as an inline deterministic planning benchmark, not as a reusable professional-reference fixture. At a high level both references contain a residential kitchen/dining/utility program, private bedroom/bath relationships, multi-floor core needs, outdoor space, and reduced upper-floor use. RBEA-002 adds explicit mixed-use frontage/access context. This comparison is descriptive and does not reconstruct RBEA-001 from memory.

## Redaction

The fixture contains no client name, address, contact details, signature, title block, source PDF, screenshot, full geometry, or source coordinates. Automated checks cover schema and common contact/attachment patterns; manual content review remains the authoritative redaction check.
