import fs from 'node:fs';

async function main() {
  console.log('--- PHASE II EXIT GATE TEST: Live Apartment Generation ---');
  
  const payload = {
    projectId: 'proj_pune_pmc_exit_gate_' + Date.now(),
    projectName: 'Shivaji Nagar Residency (PMC)',
    projectType: 'apartment',
    site: {
      plotWidth: 35,
      plotDepth: 40,
      plannedFloorCount: 5,
      roadFacing: 'north',
      setbacks: { front: 4.5, rear: 3.0, left: 3.0, right: 3.0 },
    },
    apartmentConfig: {
      projectType: 'apartment',
      jurisdiction: 'pune_pmc',
      floorCount: 4,
      flatsPerFloor: 2,
      unitMix: [
        { unitType: '2bhk', count: 1, targetCarpetAreaSqM: 65 },
        { unitType: '3bhk', count: 1, targetCarpetAreaSqM: 95 },
      ],
      commonCore: {
        passengerLifts: 2,
        serviceLifts: 0,
        staircaseCount: 1,
        fireStaircaseRequired: false,
        commonLobby: true,
      },
      parking: {
        residentParkingCount: 8,
        visitorParkingCount: 2,
        twoWheelerParkingCount: 8,
        fourWheelerParkingCount: 8,
      },
      amenities: {
        groundSiteAmenities: ['children_play_area', 'visitor_parking'],
        buildingAmenities: ['society_office'],
      },
      floorStrategy: 'typical',
    },
    candidateCount: 4,
  };

  console.log('Sending generation request to http://localhost:4200/api/v1/generation/run...');
  const t0 = Date.now();

  try {
    const res = await fetch('http://localhost:4200/api/v1/generation/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
    console.log(`Response received in ${elapsed}s (HTTP ${res.status})`);

    const data = await res.json();
    fs.writeFileSync('scripts/last_exit_gate_result.json', JSON.stringify(data, null, 2));

    if (!res.ok) {
      console.error('Request failed:', data);
      process.exit(1);
    }

    console.log('Result Summary:');
    console.log(`- Success: ${data.success}`);
    console.log(`- Project ID: ${data.projectId}`);
    console.log(`- Latency: ${data.latencyMs}ms`);
    console.log(`- Candidates: ${data.candidates?.length ?? 0}`);

    if (data.candidates && data.candidates.length > 0) {
      for (let i = 0; i < data.candidates.length; i++) {
        const c = data.candidates[i];
        console.log(`\nCandidate ${i + 1} (${c.concept?.label ?? c.id}):`);
        console.log(`  - Status: ${c.status}, Source: ${c.source}`);
        console.log(`  - Strategy: ${c.concept?.strategy}`);
        console.log(`  - Stepped Footprint Vertices: ${c.building?.metadata?.steppedPolygons?.[0]?.steppedPolygon?.vertices?.length}`);
        console.log(`  - OTS Shafts: ${c.building?.metadata?.otsShafts?.length}`);
        console.log(`  - Projecting Balconies: ${c.building?.metadata?.balconies?.length}`);
        const fl = c.building?.floors?.[0];
        console.log(`  - Floor 1 Rooms: ${fl?.rooms?.length}`);
        console.log(`  - Floor 1 Walls: ${fl?.walls?.length}`);
        console.log(`  - Floor 1 Doors: ${fl?.doors?.length}`);
        console.log(`  - Floor 1 Windows: ${fl?.windows?.length}`);
        console.log(`  - Room Types: ${Array.from(new Set(fl?.rooms?.map(r => r.type))).join(', ')}`);
      }
    }

    if (data.apartmentSchematic) {
      console.log(`- Deterministic Schematic Flats: ${data.apartmentSchematic.flatsPerFloor}`);
      console.log(`- Units: ${data.apartmentSchematic.units.map(u => `${u.unitType} (Flat ${u.unitNumber})`).join(', ')}`);
      console.log(`- Core Lifts: ${data.apartmentSchematic.core.lifts.length}, Stairs: ${data.apartmentSchematic.core.stairs.length}`);
    }

    if (data.feasibility) {
      console.log(`- Feasibility Status: ${data.feasibility.status}`);
      console.log(`- Plot Area: ${data.feasibility.plotAreaMm2 / 1e6} m²`);
      console.log(`- Buildable Area: ${data.feasibility.buildableAreaMm2 / 1e6} m²`);
    }
  } catch (err) {
    console.error('Error running exit gate test:', err);
    process.exit(1);
  }
}

main();
