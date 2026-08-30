/**
 * Editor Store & React Hooks.
 * Provides subscription to EditorEngine events without duplicating domain geometry.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Building, Floor, RoomType } from '@ai-floor-planner/core';
import {
  EditorEngine,
  SelectEntityCommand,
  ClearSelectionCommand,
  SwitchFloorCommand,
  SetToolCommand,
  DeleteEntityCommand,
  IEditorCommand,
  EditorTool,
  EditorSelection,
} from '@ai-floor-planner/core';
import { PlanValidator, ValidationSummary } from '@ai-floor-planner/constraint-engine';
import {
  CURRENT_PROJECT_SCHEMA_VERSION,
  projectStorage,
  ProjectEnvelope,
  BuildingCategory,
  ProjectLifecycleStatus,
  createCanonical30x50_2BHK,
} from '../services/storage';

export interface EditorContextValue {
  engine: EditorEngine;
  building: Building;
  activeFloor: Floor;
  selection: EditorSelection | null;
  activeTool: EditorTool;
  canUndo: boolean;
  canRedo: boolean;
  validationSummary: ValidationSummary;
  projectName: string;
  projectId: string;
  projectCategory: BuildingCategory;
  projectStatus: ProjectLifecycleStatus;
  requiredRoomCounts: Partial<Record<RoomType, number>>;
  executeCommand: (cmd: IEditorCommand) => void;
  undo: () => void;
  redo: () => void;
  selectEntity: (entityType: string, entityId: string, floorId?: string) => void;
  clearSelection: () => void;
  switchFloor: (floorId: string) => void;
  setTool: (tool: EditorTool) => void;
  deleteSelected: () => void;
  saveProject: () => void;
  revalidate: () => void;
  loadProject: (projectId: string) => void;
  setBuilding: (
    building: Building,
    name?: string,
    requiredRoomCounts?: Partial<Record<RoomType, number>>,
    category?: BuildingCategory,
  ) => void;
}

export function useEditorStore() {
  // Initialize from active project or default 30x50
  const initialEnvelope = useMemo<ProjectEnvelope>(() => {
    const activeId = projectStorage.getActiveProjectId();
    if (activeId) {
      const loaded = projectStorage.load(activeId);
      if (loaded) {
        const isLegacyCanonical = loaded.projectId === 'proj_30x50_2bhk'
          && loaded.schemaVersion < CURRENT_PROJECT_SCHEMA_VERSION;
        if (!isLegacyCanonical) return loaded;
      }
    }
    const defaultBuilding = createCanonical30x50_2BHK();
    const env: ProjectEnvelope = {
      schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
      projectId: defaultBuilding.projectId,
      name: defaultBuilding.name,
      createdAt: defaultBuilding.createdAt,
      updatedAt: defaultBuilding.updatedAt,
      building: defaultBuilding,
      requiredRoomCounts: {
        living: 1,
        dining: 1,
        kitchen: 1,
        bedroom: 2,
        bathroom: 1,
      },
      category: 'residential',
      status: 'CONCEPT',
    };
    projectStorage.save(env);
    return env;
  }, []);

  const [projectName, setProjectName] = useState(initialEnvelope.name);
  const [projectId, setProjectId] = useState(initialEnvelope.projectId);
  const [projectCategory, setProjectCategory] = useState<BuildingCategory>(initialEnvelope.category ?? 'residential');
  const [projectStatus, setProjectStatus] = useState<ProjectLifecycleStatus>(initialEnvelope.status ?? 'CONCEPT');
  const projectIdentityRef = useRef({
    id: initialEnvelope.projectId,
    name: initialEnvelope.name,
    category: initialEnvelope.category ?? 'residential' as BuildingCategory,
    status: initialEnvelope.status ?? 'CONCEPT' as ProjectLifecycleStatus,
  });

  // Single EditorEngine instance
  const engine = useMemo(() => {
    return new EditorEngine(initialEnvelope.building);
  }, [initialEnvelope.building]);

  // Reactive state synced with EditorEngine
  const [building, setBuildingState] = useState<Building>(() => engine.getBuilding());
  const [editorState, setEditorState] = useState(() => engine.getState());
  // Vastu is opt-in guidance. A project that did not request it must not receive
  // an authoritative-looking score by default.
  const planValidator = useMemo(() => new PlanValidator(undefined, { enableVastu: false }), []);
  const requiredRoomCountsRef = useRef<Partial<Record<RoomType, number>>>(
    initialEnvelope.requiredRoomCounts ?? {},
  );

  // Real-time Constraint Engine validation summary
  const [validationSummary, setValidationSummary] = useState<ValidationSummary>(() => {
    return planValidator.validate(engine.getBuilding(), {
      requiredRoomCounts: requiredRoomCountsRef.current,
    });
  });

  // Subscribe to engine events
  useEffect(() => {
    const unsubscribe = engine.subscribe((event) => {
      const b = engine.getBuilding();
      const s = engine.getState();

      setBuildingState(b);
      setEditorState(s);

      if (event.type === 'building_changed' || event.type === 'history_changed') {
        const report = planValidator.validate(b, {
          requiredRoomCounts: requiredRoomCountsRef.current,
        });
        setValidationSummary(report);

        // Auto-save to LocalStorage on mutations
        try {
          projectStorage.save({
            schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
            projectId: projectIdentityRef.current.id,
            name: projectIdentityRef.current.name,
            createdAt: b.createdAt,
            updatedAt: b.updatedAt,
            building: b,
            requiredRoomCounts: requiredRoomCountsRef.current,
            category: projectIdentityRef.current.category,
            status: projectIdentityRef.current.status,
          });
        } catch (e) {
          console.warn('Autosave warning:', e);
        }
      }
    });

    return () => unsubscribe();
  }, [engine, planValidator]);

  const activeFloor = useMemo(() => {
    const currentFloor = building.floors.find(f => f.id === editorState.activeFloorId);
    return currentFloor ?? building.floors[0]!;
  }, [building, editorState.activeFloorId]);

  const executeCommand = useCallback((cmd: IEditorCommand) => {
    engine.execute(cmd);
  }, [engine]);

  const undo = useCallback(() => {
    engine.undo();
  }, [engine]);

  const redo = useCallback(() => {
    engine.redo();
  }, [engine]);

  const selectEntity = useCallback((entityType: string, entityId: string, floorId?: string) => {
    engine.execute(new SelectEntityCommand({
      entityType: entityType as any,
      entityId,
      floorId: floorId ?? activeFloor.id,
    }));
  }, [engine, activeFloor.id]);

  const clearSelection = useCallback(() => {
    engine.execute(new ClearSelectionCommand());
  }, [engine]);

  const switchFloor = useCallback((floorId: string) => {
    engine.execute(new SwitchFloorCommand(floorId));
  }, [engine]);

  const setTool = useCallback((tool: EditorTool) => {
    engine.execute(new SetToolCommand(tool));
  }, [engine]);

  const deleteSelected = useCallback(() => {
    if (!editorState.selection) return;
    engine.execute(new DeleteEntityCommand(editorState.selection.entityType, editorState.selection.entityId));
  }, [engine, editorState.selection]);

  const saveProject = useCallback(() => {
    projectStorage.save({
      schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
      projectId,
      name: projectName,
      createdAt: building.createdAt,
      updatedAt: new Date().toISOString(),
      building,
      requiredRoomCounts: requiredRoomCountsRef.current,
      category: projectCategory,
      status: projectStatus,
    });
  }, [projectId, projectName, building, projectCategory, projectStatus]);

  const revalidate = useCallback(() => {
    setValidationSummary(planValidator.validate(building, {
      requiredRoomCounts: requiredRoomCountsRef.current,
    }));
  }, [building, planValidator]);

  const loadProject = useCallback((newProjectId: string) => {
    const loaded = projectStorage.load(newProjectId);
    if (!loaded) return;
    setProjectId(loaded.projectId);
    setProjectName(loaded.name);
    setProjectCategory(loaded.category ?? 'residential');
    setProjectStatus(loaded.status ?? 'CONCEPT');
    projectIdentityRef.current = {
      id: loaded.projectId,
      name: loaded.name,
      category: loaded.category ?? 'residential',
      status: loaded.status ?? 'CONCEPT',
    };
    requiredRoomCountsRef.current = loaded.requiredRoomCounts ?? {};
    engine.setBuilding(loaded.building);
  }, [engine]);

  const setBuilding = useCallback((
    newBuilding: Building,
    newName?: string,
    requiredRoomCounts: Partial<Record<RoomType, number>> = {},
    category: BuildingCategory = 'residential',
  ) => {
    const resolvedName = newName || newBuilding.name;
    if (newName) setProjectName(newName);
    setProjectId(newBuilding.projectId);
    setProjectCategory(category);
    setProjectStatus('CONCEPT');
    projectIdentityRef.current = {
      id: newBuilding.projectId,
      name: resolvedName,
      category,
      status: 'CONCEPT',
    };
    requiredRoomCountsRef.current = requiredRoomCounts;
    projectStorage.save({
      schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
      projectId: newBuilding.projectId,
      name: resolvedName,
      createdAt: newBuilding.createdAt,
      updatedAt: new Date().toISOString(),
      building: newBuilding,
      requiredRoomCounts,
      category,
      status: 'CONCEPT',
    });
    engine.setBuilding(newBuilding);
  }, [engine]);

  return {
    engine,
    building,
    activeFloor,
    selection: editorState.selection,
    activeTool: editorState.activeTool,
    canUndo: editorState.historySummary.canUndo,
    canRedo: editorState.historySummary.canRedo,
    validationSummary,
    projectName,
    projectId,
    projectCategory,
    projectStatus,
    requiredRoomCounts: requiredRoomCountsRef.current,
    executeCommand,
    undo,
    redo,
    selectEntity,
    clearSelection,
    switchFloor,
    setTool,
    deleteSelected,
    saveProject,
    revalidate,
    loadProject,
    setBuilding,
  };
}
