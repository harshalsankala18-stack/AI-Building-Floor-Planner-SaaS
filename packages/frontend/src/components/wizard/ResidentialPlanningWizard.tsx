import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Home,
  Info,
  Layers,
  Maximize2,
  Sparkles,
  X,
  AlertTriangle,
  Ruler,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import type {
  Building,
  FootprintShapeType,
} from '@ai-floor-planner/core';
import {
  FOOTPRINT_SHAPES,
  checkFootprintFeasibility,
} from '@ai-floor-planner/core';
import {
  CURRENT_PROJECT_SCHEMA_VERSION,
  projectStorage,
  type BuildingCategory,
} from '../../services/storage';
import { generateResidentialPlanFromBrief } from '../../services/residential-generator';
import './ResidentialPlanningWizard.css';

export interface ResidentialWizardBrief {
  projectName: string;
  typology: 'independent_house' | 'villa' | 'row_house' | 'duplex' | 'twin_bungalow' | 'apartment' | 'multi_unit' | 'custom';
  floors: number;
  occupancyType: 'single_family' | 'multi_family';

  locationCity: string;
  authority: string;
  unit: 'ft' | 'm';
  plotWidth: number;
  plotDepth: number;
  plotShape: 'rectangular' | 'corner' | 'irregular' | 'narrow';
  roadFacing: 'north' | 'east' | 'south' | 'west';
  roadCount: 1 | 2 | 3;
  roadWidthFt: number;
  northOrientationDeg: number;
  setbacks: {
    frontFt: number;
    rearFt: number;
    leftFt: number;
    rightFt: number;
  };

  footprintShape: FootprintShapeType;
  openingDirection: 'north' | 'east' | 'south' | 'west';
  courtyardSize: 'compact' | 'medium' | 'spacious';
  wingOrientation: 'balanced' | 'front_heavy' | 'rear_heavy';
  entranceSide: 'north' | 'east' | 'south' | 'west';
  openSpacePreference: 'garden' | 'compact' | 'parking_priority';

  presetBhk: 'studio' | '1bhk' | '2bhk' | '3bhk' | '4bhk' | '5bhk' | 'custom';
  rooms: {
    living: number;
    dining: number;
    familyLounge: number;
    bedrooms: number;
    attachedBaths: number;
    commonBaths: number;
    kitchenType: 'closed' | 'open' | 'semi_open';
    utility: boolean;
    pooja: boolean;
    poojaPlacement: 'northeast_vastu' | 'any';
    balconies: number;
    verandah: boolean;
    courtyard: boolean;
    dressingRooms: number;
    servantRoom: boolean;
    parkingCars: number;
    parkingTwoWheelers: number;
  };

  vastuLevel: 'strict' | 'moderate' | 'flexible' | 'none';
  ventilationPriority: 'cross_ventilation' | 'standard' | 'high_daylight';
  spatialLayout: 'open_plan' | 'traditional';
  idealHomeDescription: string;
  avoidancesDescription: string;
}

export interface ResidentialPlanningWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (building: Building, name: string, category: BuildingCategory) => void;
  initialBrief?: Partial<ResidentialWizardBrief>;
  existingBuilding?: Building;
}

const TYPOLOGY_OPTIONS = [
  { id: 'independent_house', title: 'Independent House', desc: 'Stand-alone private home on individual plot.' },
  { id: 'villa', title: 'Villa / Bungalow', desc: 'Spacious luxury home with wraparound garden setbacks.' },
  { id: 'row_house', title: 'Row House / Townhome', desc: 'Shared sidewalls with front and rear light access.' },
  { id: 'duplex', title: 'Duplex Residence', desc: 'Two connected levels with internal vertical flow.' },
  { id: 'twin_bungalow', title: 'Twin Bungalow', desc: 'Semi-detached home with one shared boundary wall.' },
  { id: 'apartment', title: 'Apartment / Flat', desc: 'Self-contained single-level floor plate.' },
  { id: 'multi_unit', title: 'Multi-Unit Floors', desc: 'G+2 or G+3 independent family rental floors.' },
  { id: 'custom', title: 'Custom Residence', desc: 'Tailored architectural layout for specific requirements.' },
] as const;

const SHAPE_DESCRIPTIONS: Record<FootprintShapeType, { title: string; desc: string }> = {
  rectangle: { title: 'Rectangular', desc: 'Efficient, economical universal building envelope.' },
  square: { title: 'Square', desc: 'Optimized perimeter ratio with central structural core.' },
  l_shape: { title: 'L-Shaped', desc: 'Wraps around private corner lawn or entrance court.' },
  u_shape: { title: 'U-Shaped', desc: 'Twin wings embracing central courtyard or entrance plaza.' },
  courtyard: { title: 'Courtyard (Aangan)', desc: 'Traditional inward-focused courtyard with cross breeze.' },
  h_shape: { title: 'H-Shaped', desc: 'Dual private/public wings linked by circulation gallery.' },
  t_shape: { title: 'T-Shaped', desc: 'Clear front public wing and rear private wing zoning.' },
  v_shape: { title: 'V-Shaped', desc: 'Articulated dual wings capturing dual sun aspects.' },
  z_shape: { title: 'Z-Shaped', desc: 'Staggered dual wings framing front and rear courts.' },
  linear: { title: 'Linear Bar', desc: 'Slim continuous block ideal for deep narrow plots.' },
  stepped: { title: 'Stepped / Terraced', desc: 'Staggered massing creating terrace gardens and light.' },
  custom: { title: 'Custom Freeform', desc: 'Direct orthogonal building perimeter adapted to plot.' },
  flexible: { title: 'Flexible Auto-Fit', desc: 'Planner selects ideal geometry based on plot aspect ratio.' },
};

function renderFootprintSvg(shape: FootprintShapeType): React.ReactNode {
  const stroke = '#1E3A2F';
  const fill = 'rgba(30, 58, 47, 0.12)';
  const strokeW = 2;

  switch (shape) {
    case 'rectangle':
      return <rect x="8" y="14" width="48" height="36" rx="2" fill={fill} stroke={stroke} strokeWidth={strokeW} />;
    case 'square':
      return <rect x="12" y="12" width="40" height="40" rx="2" fill={fill} stroke={stroke} strokeWidth={strokeW} />;
    case 'l_shape':
      return <path d="M 12 12 L 32 12 L 32 32 L 52 32 L 52 52 L 12 52 Z" fill={fill} stroke={stroke} strokeWidth={strokeW} />;
    case 'u_shape':
      return <path d="M 10 12 L 24 12 L 24 34 L 40 34 L 40 12 L 54 12 L 54 52 L 10 52 Z" fill={fill} stroke={stroke} strokeWidth={strokeW} />;
    case 'courtyard':
      return (
        <g fill={fill} stroke={stroke} strokeWidth={strokeW}>
          <rect x="10" y="10" width="44" height="44" rx="2" />
          <rect x="24" y="24" width="16" height="16" fill="#FFFFFF" stroke={stroke} strokeDasharray="2,2" />
        </g>
      );
    case 'h_shape':
      return <path d="M 10 10 L 22 10 L 22 26 L 42 26 L 42 10 L 54 10 L 54 54 L 42 54 L 42 38 L 22 38 L 22 54 L 10 54 Z" fill={fill} stroke={stroke} strokeWidth={strokeW} />;
    case 't_shape':
      return <path d="M 10 12 L 54 12 L 54 26 L 38 26 L 38 52 L 26 52 L 26 26 L 10 26 Z" fill={fill} stroke={stroke} strokeWidth={strokeW} />;
    case 'v_shape':
      return <path d="M 10 12 L 24 12 L 32 36 L 40 12 L 54 12 L 40 52 L 24 52 Z" fill={fill} stroke={stroke} strokeWidth={strokeW} />;
    case 'z_shape':
      return <path d="M 10 12 L 36 12 L 36 30 L 54 30 L 54 52 L 28 52 L 28 34 L 10 34 Z" fill={fill} stroke={stroke} strokeWidth={strokeW} />;
    case 'linear':
      return <rect x="8" y="22" width="48" height="20" rx="2" fill={fill} stroke={stroke} strokeWidth={strokeW} />;
    case 'stepped':
      return <path d="M 10 12 L 32 12 L 32 24 L 46 24 L 46 36 L 54 36 L 54 52 L 10 52 Z" fill={fill} stroke={stroke} strokeWidth={strokeW} />;
    case 'custom':
      return <path d="M 12 14 L 38 14 L 38 24 L 52 24 L 52 48 L 26 48 L 26 36 L 12 36 Z" fill={fill} stroke={stroke} strokeWidth={strokeW} />;
    case 'flexible':
    default:
      return (
        <g stroke={stroke} strokeWidth={strokeW} fill="none">
          <rect x="12" y="14" width="40" height="36" rx="2" strokeDasharray="3,3" />
          <path d="M 22 32 L 32 22 L 42 32" strokeWidth="2" strokeLinecap="round" />
          <path d="M 32 22 L 32 42" strokeWidth="2" strokeLinecap="round" />
        </g>
      );
  }
}

export const ResidentialPlanningWizard: React.FC<ResidentialPlanningWizardProps> = ({
  isOpen,
  onClose,
  onComplete,
  initialBrief,
  existingBuilding,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Form State
  const [projectName, setProjectName] = useState(initialBrief?.projectName || existingBuilding?.name || 'Vasant Vihar Residence');
  const [typology, setTypology] = useState<ResidentialWizardBrief['typology']>(initialBrief?.typology || 'independent_house');
  const [floors, setFloors] = useState<number>(initialBrief?.floors || existingBuilding?.site?.plannedFloorCount || 2);
  const [occupancyType, setOccupancyType] = useState<'single_family' | 'multi_family'>(initialBrief?.occupancyType || 'single_family');

  const [locationCity, setLocationCity] = useState(initialBrief?.locationCity || 'Bengaluru');
  const [authority, setAuthority] = useState(initialBrief?.authority || 'BBMP / BDA');
  const [unit, setUnit] = useState<'ft' | 'm'>(initialBrief?.unit || 'ft');
  const [plotWidth, setPlotWidth] = useState<number>(initialBrief?.plotWidth || (existingBuilding ? Math.round(existingBuilding.site.plotWidth / 304.8) : 40));
  const [plotDepth, setPlotDepth] = useState<number>(initialBrief?.plotDepth || (existingBuilding ? Math.round(existingBuilding.site.plotDepth / 304.8) : 60));
  const [plotShape, setPlotShape] = useState<'rectangular' | 'corner' | 'irregular' | 'narrow'>(initialBrief?.plotShape || 'rectangular');
  const [roadFacing, setRoadFacing] = useState<'north' | 'east' | 'south' | 'west'>(initialBrief?.roadFacing || 'north');
  const [roadCount, setRoadCount] = useState<1 | 2 | 3>(initialBrief?.roadCount || 1);
  const [roadWidthFt, setRoadWidthFt] = useState<number>(initialBrief?.roadWidthFt || 30);
  const [northOrientationDeg, setNorthOrientationDeg] = useState<number>(initialBrief?.northOrientationDeg || 0);

  const [frontSetbackFt, setFrontSetbackFt] = useState<number>(initialBrief?.setbacks?.frontFt ?? 7);
  const [rearSetbackFt, setRearSetbackFt] = useState<number>(initialBrief?.setbacks?.rearFt ?? 4);
  const [leftSetbackFt, setLeftSetbackFt] = useState<number>(initialBrief?.setbacks?.leftFt ?? 4);
  const [rightSetbackFt, setRightSetbackFt] = useState<number>(initialBrief?.setbacks?.rightFt ?? 4);

  const [footprintShape, setFootprintShape] = useState<FootprintShapeType>(initialBrief?.footprintShape || 'l_shape');
  const [openingDirection, setOpeningDirection] = useState<'north' | 'east' | 'south' | 'west'>(initialBrief?.openingDirection || 'north');
  const [courtyardSize, setCourtyardSize] = useState<'compact' | 'medium' | 'spacious'>(initialBrief?.courtyardSize || 'medium');
  const [wingOrientation, setWingOrientation] = useState<'balanced' | 'front_heavy' | 'rear_heavy'>(initialBrief?.wingOrientation || 'balanced');
  const [entranceSide, setEntranceSide] = useState<'north' | 'east' | 'south' | 'west'>(initialBrief?.entranceSide || 'north');
  const [openSpacePreference, setOpenSpacePreference] = useState<'garden' | 'compact' | 'parking_priority'>(initialBrief?.openSpacePreference || 'garden');

  const [presetBhk, setPresetBhk] = useState<'studio' | '1bhk' | '2bhk' | '3bhk' | '4bhk' | '5bhk' | 'custom'>(initialBrief?.presetBhk || '3bhk');
  const [bedrooms, setBedrooms] = useState<number>(initialBrief?.rooms?.bedrooms ?? 3);
  const [attachedBaths, setAttachedBaths] = useState<number>(initialBrief?.rooms?.attachedBaths ?? 2);
  const [commonBaths, setCommonBaths] = useState<number>(initialBrief?.rooms?.commonBaths ?? 1);
  const [livingRooms, setLivingRooms] = useState<number>(initialBrief?.rooms?.living ?? 1);
  const [diningRooms, setDiningRooms] = useState<number>(initialBrief?.rooms?.dining ?? 1);
  const [familyLounge, setFamilyLounge] = useState<number>(initialBrief?.rooms?.familyLounge ?? 1);
  const [kitchenType, setKitchenType] = useState<'closed' | 'open' | 'semi_open'>(initialBrief?.rooms?.kitchenType ?? 'open');
  const [utility, setUtility] = useState<boolean>(initialBrief?.rooms?.utility ?? true);
  const [pooja, setPooja] = useState<boolean>(initialBrief?.rooms?.pooja ?? true);
  const [balconies, setBalconies] = useState<number>(initialBrief?.rooms?.balconies ?? 2);
  const [verandah, setVerandah] = useState<boolean>(initialBrief?.rooms?.verandah ?? true);
  const [internalCourtyard, setInternalCourtyard] = useState<boolean>(initialBrief?.rooms?.courtyard ?? false);
  const [servantRoom, setServantRoom] = useState<boolean>(initialBrief?.rooms?.servantRoom ?? false);
  const [parkingCars, setParkingCars] = useState<number>(initialBrief?.rooms?.parkingCars ?? 1);
  const [parkingTwoWheelers, setParkingTwoWheelers] = useState<number>(initialBrief?.rooms?.parkingTwoWheelers ?? 2);

  const [vastuLevel, setVastuLevel] = useState<'strict' | 'moderate' | 'flexible' | 'none'>(initialBrief?.vastuLevel || 'moderate');
  const [ventilationPriority, setVentilationPriority] = useState<'cross_ventilation' | 'standard' | 'high_daylight'>(initialBrief?.ventilationPriority || 'cross_ventilation');
  const [spatialLayout, setSpatialLayout] = useState<'open_plan' | 'traditional'>(initialBrief?.spatialLayout || 'open_plan');
  const [idealHomeDescription, setIdealHomeDescription] = useState<string>(initialBrief?.idealHomeDescription || '');
  const [avoidancesDescription, setAvoidancesDescription] = useState<string>(initialBrief?.avoidancesDescription || '');

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Dimensional Math
  const conversionFactor = unit === 'm' ? 1000 : 304.8;
  const plotWidthMm = Math.round(plotWidth * conversionFactor);
  const plotDepthMm = Math.round(plotDepth * conversionFactor);
  const plotAreaSqFt = unit === 'ft' ? plotWidth * plotDepth : Math.round(plotWidth * plotDepth * 10.7639);
  const plotAreaSqM = Math.round((plotWidthMm * plotDepthMm) / 1_000_000);

  const frontMm = Math.round(frontSetbackFt * 304.8);
  const rearMm = Math.round(rearSetbackFt * 304.8);
  const leftMm = Math.round(leftSetbackFt * 304.8);
  const rightMm = Math.round(rightSetbackFt * 304.8);

  const buildableWidthMm = Math.max(0, plotWidthMm - leftMm - rightMm);
  const buildableDepthMm = Math.max(0, plotDepthMm - frontMm - rearMm);
  const buildableAreaSqFt = Math.round((buildableWidthMm * buildableDepthMm) / 92_903.04);
  const groundCoveragePercent = plotWidthMm * plotDepthMm > 0 ? Math.round(((buildableWidthMm * buildableDepthMm) / (plotWidthMm * plotDepthMm)) * 100) : 0;
  const estimatedBuiltUpAreaSqFt = Math.round(buildableAreaSqFt * 0.85 * floors);
  const estimatedCarpetAreaSqFt = Math.round(estimatedBuiltUpAreaSqFt * 0.78);

  // Feasibility Check
  const feasibilityResult = useMemo(() => {
    return checkFootprintFeasibility(
      {
        site: {
          plotWidth: plotWidthMm,
          plotDepth: plotDepthMm,
          setbacks: {
            front: frontMm,
            rear: rearMm,
            left: leftMm,
            right: rightMm,
          },
        },
      } as any,
      footprintShape,
    );
  }, [footprintShape, plotWidthMm, plotDepthMm, frontMm, rearMm, leftMm, rightMm]);

  // Apply BHK preset
  const handleSelectBhk = (bhk: 'studio' | '1bhk' | '2bhk' | '3bhk' | '4bhk' | '5bhk' | 'custom') => {
    setPresetBhk(bhk);
    if (bhk === 'studio') {
      setBedrooms(0);
      setAttachedBaths(0);
      setCommonBaths(1);
      setLivingRooms(1);
      setDiningRooms(0);
      setFamilyLounge(0);
      setBalconies(1);
      setPooja(false);
      setUtility(false);
    } else if (bhk === '1bhk') {
      setBedrooms(1);
      setAttachedBaths(1);
      setCommonBaths(0);
      setLivingRooms(1);
      setDiningRooms(1);
      setFamilyLounge(0);
      setBalconies(1);
      setPooja(true);
      setUtility(true);
    } else if (bhk === '2bhk') {
      setBedrooms(2);
      setAttachedBaths(1);
      setCommonBaths(1);
      setLivingRooms(1);
      setDiningRooms(1);
      setFamilyLounge(0);
      setBalconies(2);
      setPooja(true);
      setUtility(true);
      setParkingCars(1);
    } else if (bhk === '3bhk') {
      setBedrooms(3);
      setAttachedBaths(2);
      setCommonBaths(1);
      setLivingRooms(1);
      setDiningRooms(1);
      setFamilyLounge(1);
      setBalconies(2);
      setPooja(true);
      setUtility(true);
      setParkingCars(1);
    } else if (bhk === '4bhk') {
      setBedrooms(4);
      setAttachedBaths(3);
      setCommonBaths(1);
      setLivingRooms(1);
      setDiningRooms(1);
      setFamilyLounge(1);
      setBalconies(3);
      setPooja(true);
      setUtility(true);
      setServantRoom(true);
      setParkingCars(2);
    } else if (bhk === '5bhk') {
      setBedrooms(5);
      setAttachedBaths(4);
      setCommonBaths(1);
      setLivingRooms(1);
      setDiningRooms(1);
      setFamilyLounge(1);
      setBalconies(4);
      setPooja(true);
      setUtility(true);
      setInternalCourtyard(true);
      setServantRoom(true);
      setParkingCars(2);
    }
  };

  if (!isOpen) return null;

  // Complete and Generate Handler
  const handleGenerate = () => {
    setIsGenerating(true);
    setGenerationError(null);

    const safeName = projectName.trim() || 'Residential Building Plan';

    const wizardBriefData: ResidentialWizardBrief = {
      projectName: safeName,
      typology,
      floors,
      occupancyType,
      locationCity,
      authority,
      unit,
      plotWidth,
      plotDepth,
      plotShape,
      roadFacing,
      roadCount,
      roadWidthFt,
      northOrientationDeg,
      setbacks: {
        frontFt: frontSetbackFt,
        rearFt: rearSetbackFt,
        leftFt: leftSetbackFt,
        rightFt: rightSetbackFt,
      },
      footprintShape,
      openingDirection,
      courtyardSize,
      wingOrientation,
      entranceSide,
      openSpacePreference,
      presetBhk,
      rooms: {
        living: livingRooms,
        dining: diningRooms,
        familyLounge,
        bedrooms,
        attachedBaths,
        commonBaths,
        kitchenType,
        utility,
        pooja,
        poojaPlacement: 'northeast_vastu',
        balconies,
        verandah,
        courtyard: internalCourtyard,
        dressingRooms: 0,
        servantRoom,
        parkingCars,
        parkingTwoWheelers,
      },
      vastuLevel,
      ventilationPriority,
      spatialLayout,
      idealHomeDescription,
      avoidancesDescription,
    };

    try {
      // Execute authoritative architectural plan generation
      const genResult = generateResidentialPlanFromBrief(wizardBriefData, {
        seed: 101,
        existingBuilding,
      });

      const {
        building: generatedBuilding,
        candidates,
        spaceProgram,
        footprintIntent,
      } = genResult;

      // Persist full generated envelope into projectStorage
      projectStorage.save({
        schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
        projectId: generatedBuilding.projectId,
        name: safeName,
        createdAt: generatedBuilding.createdAt,
        updatedAt: new Date().toISOString(),
        building: generatedBuilding,
        category: 'residential',
        spaceProgram,
        footprintIntent,
        wizardBrief: wizardBriefData as unknown as Record<string, unknown>,
        generationSession: {
          schemaVersion: 1,
          generatedAt: new Date().toISOString(),
          requestSeed: 101,
          selectedCandidateId: genResult.selectedCandidateId,
          candidates,
        },
        pendingAiGeneration: true,
        status: 'GENERATED',
      });

      // Set active project id
      projectStorage.setActiveProjectId(generatedBuilding.projectId);

      onComplete(generatedBuilding, safeName, 'residential');
      onClose();
    } catch (genErr) {
      console.error('Plan generation failed:', genErr);
      setGenerationError(genErr instanceof Error ? genErr.message : String(genErr));
      setIsGenerating(false);
    }
  };

  return (
    <div className="wizard-backdrop" onClick={onClose}>
      <div className="wizard-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <header className="wizard-header">
          <div className="wizard-header-top">
            <div className="wizard-title-group">
              <h2>Residential Planning Wizard</h2>
              <p>Step {currentStep} of 6 — Design your architectural layout with precision</p>
            </div>
            <button className="wizard-close-btn" onClick={onClose} aria-label="Close wizard">
              <X size={16} />
            </button>
          </div>

          {/* Stepper Rail */}
          <nav className="wizard-steps-rail">
            {[
              { num: 1, label: 'Typology' },
              { num: 2, label: 'Site & Plot' },
              { num: 3, label: 'Footprint Shape' },
              { num: 4, label: 'Space Program' },
              { num: 5, label: 'Lifestyle Brief' },
              { num: 6, label: 'Review & Generate' },
            ].map((step, idx) => (
              <React.Fragment key={step.num}>
                <button
                  type="button"
                  className={`wizard-step-node ${currentStep === step.num ? 'active' : currentStep > step.num ? 'completed' : ''}`}
                  onClick={() => setCurrentStep(step.num as any)}
                >
                  <span className="wizard-step-number">
                    {currentStep > step.num ? <Check size={12} /> : step.num}
                  </span>
                  <span className="wizard-step-label">{step.label}</span>
                </button>
                {idx < 5 && <div className="wizard-step-divider" />}
              </React.Fragment>
            ))}
          </nav>
        </header>

        {/* Wizard Body */}
        <main className="wizard-body">
          {/* STEP 1: Project & Typology */}
          {currentStep === 1 && (
            <section>
              <div className="wizard-form-group">
                <label htmlFor="wizard-project-name">Project Name</label>
                <input
                  id="wizard-project-name"
                  type="text"
                  className="wizard-input"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="e.g., Green Valley Villa"
                />
              </div>

              <div className="wizard-section-title">
                <Home size={15} /> Select Residential Typology
              </div>
              <div className="wizard-typology-grid">
                {TYPOLOGY_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`wizard-typology-card ${typology === opt.id ? 'selected' : ''}`}
                    onClick={() => setTypology(opt.id)}
                  >
                    <strong>{opt.title}</strong>
                    <span>{opt.desc}</span>
                  </button>
                ))}
              </div>

              <div className="wizard-row">
                <div className="wizard-form-group">
                  <label>Number of Floors</label>
                  <div className="wizard-pill-group">
                    {[
                      { val: 1, label: '1 (Ground Only)' },
                      { val: 2, label: '2 (G + 1)' },
                      { val: 3, label: '3 (G + 2)' },
                      { val: 4, label: '4 (G + 3)' },
                    ].map(f => (
                      <button
                        key={f.val}
                        type="button"
                        className={`wizard-pill-btn ${floors === f.val ? 'active' : ''}`}
                        onClick={() => setFloors(f.val)}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="wizard-form-group">
                  <label>Occupancy Model</label>
                  <div className="wizard-pill-group">
                    {[
                      { id: 'single_family', label: 'Single Family' },
                      { id: 'multi_family', label: 'Multi-Family / Rental' },
                    ].map(occ => (
                      <button
                        key={occ.id}
                        type="button"
                        className={`wizard-pill-btn ${occupancyType === occ.id ? 'active' : ''}`}
                        onClick={() => setOccupancyType(occ.id as any)}
                      >
                        {occ.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* STEP 2: Site & Plot Details */}
          {currentStep === 2 && (
            <div className="wizard-site-layout">
              <div className="wizard-site-form">
                <div className="wizard-row">
                  <div className="wizard-form-group">
                    <label>City / Location</label>
                    <input
                      type="text"
                      className="wizard-input"
                      value={locationCity}
                      onChange={e => setLocationCity(e.target.value)}
                    />
                  </div>
                  <div className="wizard-form-group">
                    <label>Planning Authority / Bye-laws</label>
                    <input
                      type="text"
                      className="wizard-input"
                      value={authority}
                      onChange={e => setAuthority(e.target.value)}
                    />
                  </div>
                </div>

                <div className="wizard-row">
                  <div className="wizard-form-group">
                    <label>Unit System</label>
                    <div className="wizard-pill-group">
                      <button
                        type="button"
                        className={`wizard-pill-btn ${unit === 'ft' ? 'active' : ''}`}
                        onClick={() => setUnit('ft')}
                      >
                        Feet / Sq.Ft
                      </button>
                      <button
                        type="button"
                        className={`wizard-pill-btn ${unit === 'm' ? 'active' : ''}`}
                        onClick={() => setUnit('m')}
                      >
                        Meters / Sq.M
                      </button>
                    </div>
                  </div>

                  <div className="wizard-form-group">
                    <label>Plot Width ({unit})</label>
                    <input
                      type="number"
                      min={15}
                      max={200}
                      className="wizard-input"
                      value={plotWidth}
                      onChange={e => setPlotWidth(Math.max(10, Number(e.target.value)))}
                    />
                  </div>

                  <div className="wizard-form-group">
                    <label>Plot Depth ({unit})</label>
                    <input
                      type="number"
                      min={15}
                      max={300}
                      className="wizard-input"
                      value={plotDepth}
                      onChange={e => setPlotDepth(Math.max(10, Number(e.target.value)))}
                    />
                  </div>
                </div>

                <div className="wizard-row">
                  <div className="wizard-form-group">
                    <label>Plot Shape</label>
                    <div className="wizard-pill-group">
                      {[
                        { id: 'rectangular', label: 'Rectangular' },
                        { id: 'corner', label: 'Corner Plot' },
                        { id: 'narrow', label: 'Narrow Frontage' },
                        { id: 'irregular', label: 'Irregular' },
                      ].map(ps => (
                        <button
                          key={ps.id}
                          type="button"
                          className={`wizard-pill-btn ${plotShape === ps.id ? 'active' : ''}`}
                          onClick={() => setPlotShape(ps.id as any)}
                        >
                          {ps.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="wizard-form-group">
                    <label>Road Access Count</label>
                    <div className="wizard-pill-group">
                      {[1, 2, 3].map(rc => (
                        <button
                          key={rc}
                          type="button"
                          className={`wizard-pill-btn ${roadCount === rc ? 'active' : ''}`}
                          onClick={() => setRoadCount(rc as any)}
                        >
                          {rc} {rc === 1 ? 'Road' : 'Roads'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="wizard-row">
                  <div className="wizard-form-group">
                    <label>Primary Road-Facing Side</label>
                    <div className="wizard-pill-group">
                      {(['north', 'east', 'south', 'west'] as const).map(dir => (
                        <button
                          key={dir}
                          type="button"
                          className={`wizard-pill-btn ${roadFacing === dir ? 'active' : ''}`}
                          onClick={() => setRoadFacing(dir)}
                        >
                          {dir.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="wizard-form-group">
                    <label>Road Width</label>
                    <div className="wizard-pill-group">
                      {[30, 40, 60].map(rw => (
                        <button
                          key={rw}
                          type="button"
                          className={`wizard-pill-btn ${roadWidthFt === rw ? 'active' : ''}`}
                          onClick={() => setRoadWidthFt(rw)}
                        >
                          {rw} ft
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="wizard-form-group">
                    <label>North Direction</label>
                    <div className="wizard-pill-group">
                      {[
                        { deg: 0, label: 'North Up' },
                        { deg: 90, label: 'East Up' },
                        { deg: 180, label: 'South Up' },
                        { deg: 270, label: 'West Up' },
                      ].map(no => (
                        <button
                          key={no.deg}
                          type="button"
                          className={`wizard-pill-btn ${northOrientationDeg === no.deg ? 'active' : ''}`}
                          onClick={() => setNorthOrientationDeg(no.deg)}
                        >
                          {no.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="wizard-section-title" style={{ marginTop: '16px' }}>
                  <Ruler size={14} /> Mandatory Setback Clearances ({unit})
                </div>
                <div className="wizard-row">
                  <div className="wizard-form-group">
                    <label>Front Road</label>
                    <input
                      type="number"
                      step="0.5"
                      className="wizard-input"
                      value={frontSetbackFt}
                      onChange={e => setFrontSetbackFt(Number(e.target.value))}
                    />
                  </div>
                  <div className="wizard-form-group">
                    <label>Rear</label>
                    <input
                      type="number"
                      step="0.5"
                      className="wizard-input"
                      value={rearSetbackFt}
                      onChange={e => setRearSetbackFt(Number(e.target.value))}
                    />
                  </div>
                  <div className="wizard-form-group">
                    <label>Left Side</label>
                    <input
                      type="number"
                      step="0.5"
                      className="wizard-input"
                      value={leftSetbackFt}
                      onChange={e => setLeftSetbackFt(Number(e.target.value))}
                    />
                  </div>
                  <div className="wizard-form-group">
                    <label>Right Side</label>
                    <input
                      type="number"
                      step="0.5"
                      className="wizard-input"
                      value={rightSetbackFt}
                      onChange={e => setRightSetbackFt(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Live SVG Site Preview */}
              <div className="wizard-site-preview-card">
                <div className="wizard-site-preview-header">
                  <h4>Plot Preview</h4>
                  <span style={{ fontSize: '11px', color: '#7E877C' }}>
                    {plotWidth} × {plotDepth} {unit}
                  </span>
                </div>

                <div className="wizard-site-svg-container">
                  <svg viewBox="0 0 240 220" width="100%" height="100%">
                    {/* Background Grid */}
                    <defs>
                      <pattern id="wizard-grid" width="16" height="16" patternUnits="userSpaceOnUse">
                        <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#F0F2EB" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect width="240" height="220" fill="url(#wizard-grid)" />

                    {/* Road strip */}
                    {roadFacing === 'north' && (
                      <g>
                        <rect x="20" y="8" width="200" height="24" fill="#2F332E" />
                        <line x1="20" y1="20" x2="220" y2="20" stroke="#FFFFFF" strokeDasharray="6,4" strokeWidth="1.5" />
                        <text x="120" y="24" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="600">ROAD {roadWidthFt} FT</text>
                      </g>
                    )}
                    {roadFacing === 'south' && (
                      <g>
                        <rect x="20" y="188" width="200" height="24" fill="#2F332E" />
                        <line x1="20" y1="200" x2="220" y2="200" stroke="#FFFFFF" strokeDasharray="6,4" strokeWidth="1.5" />
                        <text x="120" y="204" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="600">ROAD {roadWidthFt} FT</text>
                      </g>
                    )}
                    {roadFacing === 'east' && (
                      <g>
                        <rect x="196" y="20" width="24" height="180" fill="#2F332E" />
                        <line x1="208" y1="20" x2="208" y2="200" stroke="#FFFFFF" strokeDasharray="6,4" strokeWidth="1.5" />
                        <text x="208" y="110" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="600" transform="rotate(90 208 110)">ROAD {roadWidthFt} FT</text>
                      </g>
                    )}
                    {roadFacing === 'west' && (
                      <g>
                        <rect x="20" y="20" width="24" height="180" fill="#2F332E" />
                        <line x1="32" y1="20" x2="32" y2="200" stroke="#FFFFFF" strokeDasharray="6,4" strokeWidth="1.5" />
                        <text x="32" y="110" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="600" transform="rotate(-90 32 110)">ROAD {roadWidthFt} FT</text>
                      </g>
                    )}

                    {/* Plot Outline */}
                    <rect
                      x="48"
                      y="40"
                      width="144"
                      height="140"
                      fill="#FFFFFF"
                      stroke="#1C1E1B"
                      strokeWidth="2"
                    />

                    {/* Setbacks & Buildable Zone */}
                    <rect
                      x="62"
                      y="54"
                      width="116"
                      height="112"
                      fill="rgba(30, 58, 47, 0.08)"
                      stroke="#1E3A2F"
                      strokeWidth="1.5"
                      strokeDasharray="4,3"
                    />

                    <text x="120" y="114" textAnchor="middle" fill="#1E3A2F" fontSize="9" fontWeight="600">
                      BUILDABLE ENVELOPE
                    </text>

                    {/* North Indicator */}
                    <g transform="translate(198, 52)">
                      <circle cx="10" cy="10" r="9" fill="#FFFFFF" stroke="#DFE2DA" />
                      <line x1="10" y1="17" x2="10" y2="5" stroke="#1E3A2F" strokeWidth="2" />
                      <polygon points="10,3 7,8 13,8" fill="#1E3A2F" />
                      <text x="10" y="1" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#1E3A2F">N</text>
                    </g>
                  </svg>
                </div>

                <div className="wizard-site-metrics-grid">
                  <div className="wizard-site-metric-cell">
                    <span>Total Plot Area</span>
                    <strong>{plotAreaSqFt.toLocaleString()} sq.ft ({plotAreaSqM} m²)</strong>
                  </div>
                  <div className="wizard-site-metric-cell">
                    <span>Max Ground Coverage</span>
                    <strong>{groundCoveragePercent}%</strong>
                  </div>
                  <div className="wizard-site-metric-cell">
                    <span>Buildable Footprint</span>
                    <strong>{buildableAreaSqFt.toLocaleString()} sq.ft</strong>
                  </div>
                  <div className="wizard-site-metric-cell">
                    <span>Est. Built-up ({floors} Floors)</span>
                    <strong>{estimatedBuiltUpAreaSqFt.toLocaleString()} sq.ft</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Footprint Shape Selection (13 Shapes) */}
          {currentStep === 3 && (
            <section>
              {/* Feasibility Alert */}
              {!feasibilityResult.feasible ? (
                <div className="wizard-feasibility-alert warning">
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Dimensional Notice for {SHAPE_DESCRIPTIONS[footprintShape]?.title || footprintShape}:</strong>
                    <div>{feasibilityResult.reason}</div>
                    {feasibilityResult.suggestedAlternatives.length > 0 && (
                      <div className="wizard-suggested-shapes">
                        <span>Suggested shapes that fit:</span>
                        {feasibilityResult.suggestedAlternatives.map((alt: FootprintShapeType) => (
                          <button
                            key={alt}
                            type="button"
                            className="wizard-suggested-pill"
                            onClick={() => setFootprintShape(alt)}
                          >
                            {SHAPE_DESCRIPTIONS[alt]?.title || alt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="wizard-feasibility-alert success">
                  <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Feasible Footprint Geometry:</strong>
                    <span>
                      {' '}The {SHAPE_DESCRIPTIONS[footprintShape]?.title || footprintShape} shape fits cleanly within the {Math.round(buildableWidthMm / 1000)}m × {Math.round(buildableDepthMm / 1000)}m buildable envelope with standard structural wing spans.
                    </span>
                  </div>
                </div>
              )}

              <div className="wizard-section-title">
                <Maximize2 size={15} /> Select Footprint Shape
              </div>

              <div className="wizard-shapes-grid">
                {FOOTPRINT_SHAPES.map(shapeDef => {
                  const shape = shapeDef.id;
                  const info = SHAPE_DESCRIPTIONS[shape] || { title: shapeDef.name, desc: shapeDef.description };
                  const isSelected = footprintShape === shape;
                  return (
                    <button
                      key={shape}
                      type="button"
                      className={`wizard-shape-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setFootprintShape(shape)}
                    >
                      <div className="wizard-shape-icon">
                        <svg viewBox="0 0 64 64" width="60" height="60">
                          {renderFootprintSvg(shape)}
                        </svg>
                      </div>
                      <h4 className="wizard-shape-title">{info.title}</h4>
                      <p className="wizard-shape-desc">{info.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Contextual Options for Non-Rectangular Shapes */}
              {footprintShape !== 'rectangle' && footprintShape !== 'square' && (
                <div style={{ marginTop: '20px', padding: '16px', background: '#FAFAF7', borderRadius: '10px', border: '1px solid #DFE2DA' }}>
                  <div className="wizard-section-title">
                    <Sparkles size={15} /> Shape Contextual Configuration
                  </div>
                  <div className="wizard-row">
                    <div className="wizard-form-group">
                      <label>Opening / Courtyard Orientation</label>
                      <div className="wizard-pill-group">
                        {(['north', 'east', 'south', 'west'] as const).map(dir => (
                          <button
                            key={dir}
                            type="button"
                            className={`wizard-pill-btn ${openingDirection === dir ? 'active' : ''}`}
                            onClick={() => setOpeningDirection(dir)}
                          >
                            Open to {dir.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {(footprintShape === 'u_shape' || footprintShape === 'courtyard' || footprintShape === 'h_shape') && (
                      <div className="wizard-form-group">
                        <label>Courtyard Proportion</label>
                        <div className="wizard-pill-group">
                          {[
                            { id: 'compact', label: 'Compact Court (15%)' },
                            { id: 'medium', label: 'Balanced Court (22%)' },
                            { id: 'spacious', label: 'Grand Aangan (30%)' },
                          ].map(c => (
                            <button
                              key={c.id}
                              type="button"
                              className={`wizard-pill-btn ${courtyardSize === c.id ? 'active' : ''}`}
                              onClick={() => setCourtyardSize(c.id as any)}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="wizard-form-group">
                      <label>Wing Massing Balance</label>
                      <div className="wizard-pill-group">
                        {[
                          { id: 'balanced', label: 'Balanced Wings' },
                          { id: 'front_heavy', label: 'Front Wing Dominant' },
                          { id: 'rear_heavy', label: 'Rear Wing Dominant' },
                        ].map(wo => (
                          <button
                            key={wo.id}
                            type="button"
                            className={`wizard-pill-btn ${wingOrientation === wo.id ? 'active' : ''}`}
                            onClick={() => setWingOrientation(wo.id as any)}
                          >
                            {wo.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="wizard-form-group">
                      <label>Main Entrance Side</label>
                      <div className="wizard-pill-group">
                        {(['north', 'east', 'south', 'west'] as const).map(es => (
                          <button
                            key={es}
                            type="button"
                            className={`wizard-pill-btn ${entranceSide === es ? 'active' : ''}`}
                            onClick={() => setEntranceSide(es)}
                          >
                            {es.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="wizard-form-group">
                      <label>Open Space Strategy</label>
                      <div className="wizard-pill-group">
                        {[
                          { id: 'garden', label: 'Private Lawn' },
                          { id: 'compact', label: 'Compact' },
                          { id: 'parking_priority', label: 'Front Porch' },
                        ].map(os => (
                          <button
                            key={os.id}
                            type="button"
                            className={`wizard-pill-btn ${openSpacePreference === os.id ? 'active' : ''}`}
                            onClick={() => setOpenSpacePreference(os.id as any)}
                          >
                            {os.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* STEP 4: Space Program & Room Requirements */}
          {currentStep === 4 && (
            <section>
              <div className="wizard-section-title">
                <Layers size={15} /> Quick BHK Architectural Presets
              </div>
              <div className="wizard-bhk-rail">
                {[
                  { id: 'studio', label: 'Studio' },
                  { id: '1bhk', label: '1 BHK' },
                  { id: '2bhk', label: '2 BHK' },
                  { id: '3bhk', label: '3 BHK' },
                  { id: '4bhk', label: '4 BHK' },
                  { id: '5bhk', label: '5 BHK' },
                ].map(bhk => (
                  <button
                    key={bhk.id}
                    type="button"
                    className={`wizard-pill-btn ${presetBhk === bhk.id ? 'active' : ''}`}
                    onClick={() => handleSelectBhk(bhk.id as any)}
                  >
                    {bhk.label}
                  </button>
                ))}
              </div>

              <div className="wizard-section-title" style={{ marginTop: '16px' }}>
                <Home size={15} /> Rooms & Spatial Program
              </div>

              <div className="wizard-room-counter-grid">
                <div className="wizard-room-row">
                  <div className="wizard-room-info">
                    <strong>Bedrooms</strong>
                    <span>Master & guest sleeping zones</span>
                  </div>
                  <div className="wizard-counter-ctrl">
                    <button
                      type="button"
                      className="wizard-counter-btn"
                      disabled={bedrooms <= 0}
                      onClick={() => setBedrooms(b => Math.max(0, b - 1))}
                    >
                      -
                    </button>
                    <span className="wizard-counter-val">{bedrooms}</span>
                    <button
                      type="button"
                      className="wizard-counter-btn"
                      onClick={() => setBedrooms(b => b + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="wizard-room-row">
                  <div className="wizard-room-info">
                    <strong>Attached Bathrooms</strong>
                    <span>En-suite direct bedroom access</span>
                  </div>
                  <div className="wizard-counter-ctrl">
                    <button
                      type="button"
                      className="wizard-counter-btn"
                      disabled={attachedBaths <= 0}
                      onClick={() => setAttachedBaths(b => Math.max(0, b - 1))}
                    >
                      -
                    </button>
                    <span className="wizard-counter-val">{attachedBaths}</span>
                    <button
                      type="button"
                      className="wizard-counter-btn"
                      onClick={() => setAttachedBaths(b => b + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="wizard-room-row">
                  <div className="wizard-room-info">
                    <strong>Common / Guest Bathrooms</strong>
                    <span>Accessible from living or lobby</span>
                  </div>
                  <div className="wizard-counter-ctrl">
                    <button
                      type="button"
                      className="wizard-counter-btn"
                      disabled={commonBaths <= 0}
                      onClick={() => setCommonBaths(b => Math.max(0, b - 1))}
                    >
                      -
                    </button>
                    <span className="wizard-counter-val">{commonBaths}</span>
                    <button
                      type="button"
                      className="wizard-counter-btn"
                      onClick={() => setCommonBaths(b => b + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="wizard-room-row">
                  <div className="wizard-room-info">
                    <strong>Balconies & Sit-outs</strong>
                    <span>Outdoor perimeter verandas</span>
                  </div>
                  <div className="wizard-counter-ctrl">
                    <button
                      type="button"
                      className="wizard-counter-btn"
                      disabled={balconies <= 0}
                      onClick={() => setBalconies(b => Math.max(0, b - 1))}
                    >
                      -
                    </button>
                    <span className="wizard-counter-val">{balconies}</span>
                    <button
                      type="button"
                      className="wizard-counter-btn"
                      onClick={() => setBalconies(b => b + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="wizard-room-row">
                  <div className="wizard-room-info">
                    <strong>Car Parking Slots</strong>
                    <span>Covered ground garage / porch</span>
                  </div>
                  <div className="wizard-counter-ctrl">
                    <button
                      type="button"
                      className="wizard-counter-btn"
                      disabled={parkingCars <= 0}
                      onClick={() => setParkingCars(c => Math.max(0, c - 1))}
                    >
                      -
                    </button>
                    <span className="wizard-counter-val">{parkingCars}</span>
                    <button
                      type="button"
                      className="wizard-counter-btn"
                      onClick={() => setParkingCars(c => c + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="wizard-room-row">
                  <div className="wizard-room-info">
                    <strong>Two-Wheeler Parking</strong>
                    <span>Dedicated scooter / cycle bay</span>
                  </div>
                  <div className="wizard-counter-ctrl">
                    <button
                      type="button"
                      className="wizard-counter-btn"
                      disabled={parkingTwoWheelers <= 0}
                      onClick={() => setParkingTwoWheelers(c => Math.max(0, c - 1))}
                    >
                      -
                    </button>
                    <span className="wizard-counter-val">{parkingTwoWheelers}</span>
                    <button
                      type="button"
                      className="wizard-counter-btn"
                      onClick={() => setParkingTwoWheelers(c => c + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Kitchen Configuration */}
              <div className="wizard-section-title" style={{ marginTop: '20px' }}>
                <Home size={15} /> Kitchen Architecture
              </div>
              <div className="wizard-pill-group">
                {[
                  { id: 'open', label: 'Open-Plan / Modular Island Kitchen' },
                  { id: 'closed', label: 'Enclosed Kitchen (Separated from Living)' },
                  { id: 'semi_open', label: 'Semi-Open with Breakfast Counter' },
                ].map(kt => (
                  <button
                    key={kt.id}
                    type="button"
                    className={`wizard-pill-btn ${kitchenType === kt.id ? 'active' : ''}`}
                    onClick={() => setKitchenType(kt.id as any)}
                  >
                    {kt.label}
                  </button>
                ))}
              </div>

              {/* Indian Residential Specialties */}
              <div className="wizard-section-title" style={{ marginTop: '20px' }}>
                <Sparkles size={15} /> Indian Residential Specialty Spaces
              </div>

              <div className="wizard-room-counter-grid">
                <div className="wizard-room-row">
                  <div className="wizard-room-info">
                    <strong>Pooja Room (Prayer Space)</strong>
                    <span>Northeast (Ishanya) Vastu preferred</span>
                  </div>
                  <button
                    type="button"
                    className={`wizard-pill-btn ${pooja ? 'active' : ''}`}
                    onClick={() => setPooja(!pooja)}
                  >
                    {pooja ? 'Included' : 'None'}
                  </button>
                </div>

                <div className="wizard-room-row">
                  <div className="wizard-room-info">
                    <strong>Utility & Wet Kitchen</strong>
                    <span>Washing area connected to kitchen</span>
                  </div>
                  <button
                    type="button"
                    className={`wizard-pill-btn ${utility ? 'active' : ''}`}
                    onClick={() => setUtility(!utility)}
                  >
                    {utility ? 'Included' : 'None'}
                  </button>
                </div>

                <div className="wizard-room-row">
                  <div className="wizard-room-info">
                    <strong>Front Verandah / Otla</strong>
                    <span>Traditional raised welcoming porch</span>
                  </div>
                  <button
                    type="button"
                    className={`wizard-pill-btn ${verandah ? 'active' : ''}`}
                    onClick={() => setVerandah(!verandah)}
                  >
                    {verandah ? 'Included' : 'None'}
                  </button>
                </div>

                <div className="wizard-room-row">
                  <div className="wizard-room-info">
                    <strong>Domestic Staff / Servant Room</strong>
                    <span>Attached bath with separate access</span>
                  </div>
                  <button
                    type="button"
                    className={`wizard-pill-btn ${servantRoom ? 'active' : ''}`}
                    onClick={() => setServantRoom(!servantRoom)}
                  >
                    {servantRoom ? 'Included' : 'None'}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* STEP 5: Lifestyle, Design Preferences & Free-text Brief */}
          {currentStep === 5 && (
            <section>
              <div className="wizard-row">
                <div className="wizard-form-group">
                  <label>Vastu Shastra Compliance</label>
                  <div className="wizard-pill-group">
                    {[
                      { id: 'strict', label: 'Strict (Pooja in NE, Master in SW)' },
                      { id: 'moderate', label: 'Moderate (Key zones prioritized)' },
                      { id: 'flexible', label: 'Flexible / General' },
                      { id: 'none', label: 'Functional / None' },
                    ].map(v => (
                      <button
                        key={v.id}
                        type="button"
                        className={`wizard-pill-btn ${vastuLevel === v.id ? 'active' : ''}`}
                        onClick={() => setVastuLevel(v.id as any)}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="wizard-form-group">
                  <label>Light & Ventilation Priority</label>
                  <div className="wizard-pill-group">
                    {[
                      { id: 'cross_ventilation', label: 'Cross-Ventilation Focus' },
                      { id: 'high_daylight', label: 'Maximum Natural Daylight' },
                      { id: 'standard', label: 'Standard NBC' },
                    ].map(vent => (
                      <button
                        key={vent.id}
                        type="button"
                        className={`wizard-pill-btn ${ventilationPriority === vent.id ? 'active' : ''}`}
                        onClick={() => setVentilationPriority(vent.id as any)}
                      >
                        {vent.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="wizard-form-group" style={{ marginTop: '16px' }}>
                <label>Living & Dining Spatial Style</label>
                <div className="wizard-pill-group">
                  {[
                    { id: 'open_plan', label: 'Open-Plan (Seamless Living, Dining, Kitchen)' },
                    { id: 'traditional', label: 'Compartmentalized / Traditional Privacy' },
                  ].map(sl => (
                    <button
                      key={sl.id}
                      type="button"
                      className={`wizard-pill-btn ${spatialLayout === sl.id ? 'active' : ''}`}
                      onClick={() => setSpatialLayout(sl.id as any)}
                    >
                      {sl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="wizard-form-group" style={{ marginTop: '16px' }}>
                <label htmlFor="ideal-home-desc">Describe your ideal home & lifestyle preferences</label>
                <textarea
                  id="ideal-home-desc"
                  rows={3}
                  className="wizard-input"
                  value={idealHomeDescription}
                  onChange={e => setIdealHomeDescription(e.target.value)}
                  placeholder="e.g., We love morning sunshine in the kitchen, need a quiet study nook for remote work, and want a double-height living room opening into an eastern garden..."
                />
              </div>

              <div className="wizard-form-group" style={{ marginTop: '12px' }}>
                <label htmlFor="avoidances-desc">Anything you want to avoid?</label>
                <textarea
                  id="avoidances-desc"
                  rows={2}
                  className="wizard-input"
                  value={avoidancesDescription}
                  onChange={e => setAvoidancesDescription(e.target.value)}
                  placeholder="e.g., Avoid placing bathrooms next to the main entrance; no bedrooms facing the noisy street side..."
                />
              </div>
            </section>
          )}

          {/* STEP 6: Review & Confirm */}
          {currentStep === 6 && (
            <section>
              {generationError && (
                <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', color: '#991B1B', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
                  <strong>Generation Notice:</strong> {generationError}
                </div>
              )}
              {isGenerating && (
                <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534', padding: '16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 18, height: 18, border: '2px solid #86EFAC', borderTopColor: '#16A34A', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px' }}>Synthesizing Architectural Floor Plan...</strong>
                    <span style={{ fontSize: '12px', color: '#15803D' }}>Validating setbacks, room program adjacencies, Vastu orientation, and wall geometries.</span>
                  </div>
                </div>
              )}
              <div className="wizard-review-grid">
                {/* 1. User-Provided Specifications */}
                <div className="wizard-review-card">
                  <h4><Home size={14} /> User-Provided Specifications</h4>
                  <div className="wizard-review-list">
                    <div className="wizard-review-item">
                      <span className="label">Typology</span>
                      <span className="val">{TYPOLOGY_OPTIONS.find(t => t.id === typology)?.title}</span>
                    </div>
                    <div className="wizard-review-item">
                      <span className="label">Plot Size</span>
                      <span className="val">{plotWidth} × {plotDepth} {unit} ({plotAreaSqFt.toLocaleString()} sq.ft)</span>
                    </div>
                    <div className="wizard-review-item">
                      <span className="label">Footprint Shape</span>
                      <span className="val">{SHAPE_DESCRIPTIONS[footprintShape]?.title || footprintShape}</span>
                    </div>
                    <div className="wizard-review-item">
                      <span className="label">Program Preset</span>
                      <span className="val">{presetBhk.toUpperCase()} ({bedrooms} Bed, {attachedBaths + commonBaths} Bath)</span>
                    </div>
                    <div className="wizard-review-item">
                      <span className="label">Specialty Spaces</span>
                      <span className="val">{[pooja && 'Pooja', utility && 'Utility', verandah && 'Verandah', servantRoom && 'Servant'].filter(Boolean).join(', ') || 'None'}</span>
                    </div>
                    <div className="wizard-review-item">
                      <span className="label">Vastu Preference</span>
                      <span className="val">{vastuLevel.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Calculated Planning Metrics */}
                <div className="wizard-review-card">
                  <h4><Ruler size={14} /> Calculated Architectural Metrics</h4>
                  <div className="wizard-review-list">
                    <div className="wizard-review-item">
                      <span className="label">Total Plot Area</span>
                      <span className="val">{plotAreaSqFt.toLocaleString()} sq.ft ({plotAreaSqM} m²)</span>
                    </div>
                    <div className="wizard-review-item">
                      <span className="label">Ground Buildable Area</span>
                      <span className="val">{buildableAreaSqFt.toLocaleString()} sq.ft</span>
                    </div>
                    <div className="wizard-review-item">
                      <span className="label">Ground Coverage Ratio</span>
                      <span className="val">{groundCoveragePercent}%</span>
                    </div>
                    <div className="wizard-review-item">
                      <span className="label">Floors Planned</span>
                      <span className="val">{floors} {floors === 1 ? 'Floor' : 'Floors'}</span>
                    </div>
                    <div className="wizard-review-item">
                      <span className="label">Est. Total Built-up Area</span>
                      <span className="val">~{estimatedBuiltUpAreaSqFt.toLocaleString()} sq.ft</span>
                    </div>
                    <div className="wizard-review-item">
                      <span className="label">Est. Carpet Area</span>
                      <span className="val">~{estimatedCarpetAreaSqFt.toLocaleString()} sq.ft</span>
                    </div>
                  </div>
                </div>

                {/* 3. Planning Assumptions Applied */}
                <div className="wizard-review-card">
                  <h4><ShieldCheck size={14} /> Planning Assumptions & Bye-laws</h4>
                  <div className="wizard-review-list">
                    <div className="wizard-review-item">
                      <span className="label">Road & Front Setback</span>
                      <span className="val">{frontSetbackFt} ft clearance</span>
                    </div>
                    <div className="wizard-review-item">
                      <span className="label">Rear & Side Setbacks</span>
                      <span className="val">{rearSetbackFt} ft rear, {leftSetbackFt} ft sides</span>
                    </div>
                    <div className="wizard-review-item">
                      <span className="label">Wall Dimensions</span>
                      <span className="val">230mm external, 115mm internal</span>
                    </div>
                    <div className="wizard-review-item">
                      <span className="label">Authority Guideline</span>
                      <span className="val">{authority}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Advisory / Next Steps */}
                <div className="wizard-review-card">
                  <h4><Info size={14} /> Advisory & Generation Notes</h4>
                  <div className="wizard-review-list">
                    <div className="wizard-review-item">
                      <span className="label">Geometric Authority</span>
                      <span className="val">Deterministic CAD Engine</span>
                    </div>
                    <div className="wizard-review-item">
                      <span className="label">Orthogonal Feasibility</span>
                      <span className="val">{feasibilityResult.feasible ? 'Verified' : 'Borderline Envelope'}</span>
                    </div>
                    <div className="wizard-review-item">
                      <span className="label">Post-Generation Edit</span>
                      <span className="val">Fully editable 2D CAD canvas</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>

        {/* Footer */}
        <footer className="wizard-footer">
          <div className="wizard-footer-left">
            {currentStep > 1 && (
              <button
                type="button"
                className="wizard-btn-secondary"
                onClick={() => setCurrentStep((currentStep - 1) as any)}
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}
          </div>

          <div className="wizard-footer-right">
            <button type="button" className="wizard-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            {currentStep < 6 ? (
              <button
                type="button"
                className="wizard-btn-primary"
                onClick={() => setCurrentStep((currentStep + 1) as any)}
              >
                Continue to Step {currentStep + 1} <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                className="wizard-btn-primary"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                <Sparkles size={14} /> {isGenerating ? 'Generating Floor Plan...' : 'Generate Floor Plan'}
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};
