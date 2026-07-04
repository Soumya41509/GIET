import { NexaModule, StepConfig } from './types';

export const FLOW_CONFIG: Record<NexaModule, StepConfig[]> = {
  [NexaModule.MAIN]: [
    {
      id: 'START',
      prompt: 'I am NEXA. How can I help you today?',
      options: ['File a New Issue', 'Track Status', 'FAQs', 'Support Help'],
    },
  ],
  [NexaModule.SUPPORT]: [
    {
      id: 'START',
      prompt: 'I’m here to help! What information are you looking for?',
      options: ['General FAQs', 'Contact Support', 'Main Menu'],
      next: (val: string) => {
        if (val === 'General FAQs') return 'SHOW_FAQ';
        if (val === 'Contact Support') return 'SHOW_CONTACT';
        return 'START';
      }
    },
    {
      id: 'SHOW_FAQ',
      prompt: 'You can find answers to common questions in our knowledge base. Would you like to view it?',
      options: ['Open FAQ Center', 'Back'],
    },
    {
      id: 'SHOW_CONTACT',
      prompt: 'Need to get in touch? You can reach us at:\n\n📧 Email: support@giet.edu\n📞 Helpline: +91 94371 XXXXX\n🏢 Location: GIET Admin Block',
      options: ['Main Menu'],
    }
  ],
  [NexaModule.FILING]: [
    {
      id: 'SELECT_CATEGORY',
      prompt: 'Sure, let’s get that issue filed. What category does it fall under?',
      field: 'categoryName',
      // options will be dynamic via EngineCore
      next: 'SELECT_SUBCATEGORY',
    },
    {
      id: 'SELECT_SUBCATEGORY',
      prompt: 'Got it. Select a more specific area for this issue:',
      field: 'subCategory',
      // options will be dynamic
      next: (val: any, wizard: any) => wizard.categoryName === 'Hostel' ? 'SELECT_HOSTEL' : 'ENTER_TITLE',
    },
    {
      id: 'SELECT_HOSTEL',
      prompt: 'Which Hostel Block is this concerning?',
      field: 'hostel',
      options: ['BH-1', 'BH-2', 'BH-3', 'BH-4', 'BH-5', 'GH-1', 'Skip'],
      next: 'ENTER_TITLE',
    },
    {
      id: 'ENTER_TITLE',
      prompt: 'Got it. Please provide a brief title for your grievance (e.g., "Broken fan in room 204").',
      field: 'title',
      validation: { required: true },
      next: 'ENTER_DESCRIPTION',
    },
    {
      id: 'ENTER_DESCRIPTION',
      prompt: 'Now, please describe the issue in detail. (Minimum 15 words required for accuracy).',
      field: 'description',
      validation: { required: true, minWords: 15 },
      next: 'CONFIRM_SUBMISSION',
    },
    {
      id: 'CONFIRM_SUBMISSION',
      prompt: 'Great! I have everything I need. Ready to submit?',
      options: ['Yes, Submit Now', 'No, Cancel'],
    },
  ],
  [NexaModule.TRACKING]: [
    {
      id: 'SEARCH_GRIEVANCE',
      prompt: 'I am fetching your recent grievances... Hang on.',
      field: 'selectedGrievanceId',
      next: 'VIEW_DETAILS',
    },
    {
      id: 'VIEW_DETAILS',
      prompt: 'Here is the detailed status of your issue:',
      next: 'START',
    }
  ],
  [NexaModule.ESCALATION]: [
    {
      id: 'CONFIRM_ESCALATION',
      prompt: 'Are you sure you want to escalate this issue to the higher authority?',
      options: ['Yes, Escalate', 'No, cancel'],
    },
  ],
};
