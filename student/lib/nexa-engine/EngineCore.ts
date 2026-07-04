import { NexaModule, NexaState, Intent, StepConfig, MessagePayload } from './types';
import { detectIntent } from './IntentService';
import { FLOW_CONFIG } from './FlowConfig';
import { grievanceCategories } from '@/constants/grievanceCategories';

export const INITIAL_STATE: NexaState = {
  currentModule: NexaModule.MAIN,
  currentStepId: 'START',
  messages: [],
  wizardData: {},
  context: {
    sessionStarted: new Date(),
  },
  isTyping: false,
  sessionId: undefined,
  sessionTitle: undefined,
  categories: [],
};

export const nexaReducer = (state: NexaState, action: any): NexaState => {
  switch (action.type) {
    case 'SET_TYPING':
      return { ...state, isTyping: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SWITCH_MODULE':
      return {
        ...state,
        currentModule: action.payload.module,
        currentStepId: action.payload.stepId,
        wizardData: action.payload.resetWizard ? {} : state.wizardData
      };
    case 'UPDATE_WIZARD':
      return { ...state, wizardData: { ...state.wizardData, ...action.payload } };
    case 'SET_INITIAL_STATE':
      return action.payload;
    case 'SWITCH_SESSION':
      return {
        ...INITIAL_STATE,
        sessionId: action.payload.sessionId,
        messages: action.payload.messages,
        sessionTitle: action.payload.title,
        context: { ...INITIAL_STATE.context, sessionStarted: new Date() }
      };
    case 'START_NEW_SESSION':
      return {
        ...INITIAL_STATE,
        sessionId: action.payload.sessionId,
        context: { ...INITIAL_STATE.context, sessionStarted: new Date() }
      };
    case 'RESET_FLOW':
      return {
        ...INITIAL_STATE,
        sessionId: state.sessionId, // Keep the same session ID for minor resets
      };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    default:
      return state;
  }
};

/**
 * Validates the user input against the current step config
 */
export const validateInput = (input: string, step: StepConfig): { valid: boolean; error?: string } => {
  if (!step.validation) return { valid: true };

  const { required, minWords } = step.validation;

  if (required && !input.trim()) {
    return { valid: false, error: 'This field is required.' };
  }

  if (minWords) {
    const wordCount = input.trim().split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount < minWords) {
      return {
        valid: false,
        error: `Please provide more detail. Minimum ${minWords} words required (You wrote ${wordCount}).`
      };
    }
  }

  return { valid: true };
};

/**
 * Gets dynamic options for a step (e.g. subcategories based on category)
 */
export const getStepOptions = (step: StepConfig, state: NexaState): string[] | undefined => {
  const wizardData = state.wizardData;
  const categories = state.categories;

  if (step.id === 'SELECT_CATEGORY') {
    return categories.map((c: any) => c.name);
  }

  if (step.id === 'SELECT_SUBCATEGORY') {
    const cat = categories.find((c: any) => c.name === wizardData.categoryName);
    return cat ? cat.subcategories : [];
  }
  return step.options;
};

/**
 * The main "Brain" function that decides what to do next
 */
export const processUserMessage = (
  input: string,
  state: NexaState
): {
  nextModule: NexaModule;
  nextStepId: string;
  wizardUpdate?: any;
  botResponse?: string;
  error?: string;
} => {
  const currentSteps = FLOW_CONFIG[state.currentModule];
  const currentStep = currentSteps?.find(s => s.id === state.currentStepId);

  // 1. Check for global "Cancel" or "Main Menu" intent
  if (state.currentModule !== NexaModule.MAIN) {
    const { intent } = detectIntent(input);
    const isMainMenu = input.toLowerCase().trim() === 'main menu';

    if (intent === 'CANCEL' || isMainMenu) {
      return {
        nextModule: NexaModule.MAIN,
        nextStepId: 'START',
        wizardUpdate: {},
        botResponse: 'Returning to the Main Menu. How else can I assist you?',
      };
    }
  }

  // 2. Logic based on current module
  if (state.currentModule === NexaModule.MAIN) {
    const { intent } = detectIntent(input);

    if (intent === 'FILE' || input === 'File a New Issue') return { nextModule: NexaModule.FILING, nextStepId: 'SELECT_CATEGORY' };
    if (intent === 'TRACK' || input === 'Track Status') return { nextModule: NexaModule.TRACKING, nextStepId: 'SEARCH_GRIEVANCE' };

    if (input === 'FAQs' || input === 'Support Help') {
      return {
        nextModule: NexaModule.SUPPORT,
        nextStepId: 'START'
      };
    }

    return {
      nextModule: NexaModule.MAIN,
      nextStepId: 'START',
      botResponse: "I'm not exactly sure. Could you choose an option below or try rephrasing?"
    };
  }

  // 3. Wizard Flow Logic
  if (currentStep) {
    // Validate
    const validation = validateInput(input, currentStep);
    if (!validation.valid) {
      return { nextModule: state.currentModule, nextStepId: state.currentStepId, error: validation.error };
    }

    // Save to Wizard Data
    const wizardUpdate = currentStep.field ? { [currentStep.field]: input } : undefined;
    const mergedWizard = { ...state.wizardData, ...wizardUpdate };

    // Determine Next Step
    let nextStepId = '';
    if (typeof currentStep.next === 'function') {
      nextStepId = currentStep.next(input, mergedWizard);
    } else if (typeof currentStep.next === 'string') {
      nextStepId = currentStep.next;
    } else {
      const currentIndex = currentSteps.indexOf(currentStep);
      nextStepId = currentSteps[currentIndex + 1]?.id || 'START';
    }

    // If nextStepId is START, it means module is finished
    if (nextStepId === 'START') {
      return {
        nextModule: NexaModule.MAIN,
        nextStepId: 'START',
        wizardUpdate,
      };
    }

    return {
      nextModule: state.currentModule,
      nextStepId: nextStepId,
      wizardUpdate,
    };
  }

  return { nextModule: NexaModule.MAIN, nextStepId: 'START' };
};
