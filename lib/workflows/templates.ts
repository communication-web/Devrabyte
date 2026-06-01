export type WorkflowTemplate = {
  key: string;
  name: string;
  description: string;
  stages: {
    name: string;
    order: number;
    slaHours?: number;
    reminderHours?: number;
    requiresApproval?: boolean;
  }[];
};

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    key: 'sales_followup',
    name: 'Sales Follow-up',
    description: 'Follow up on leads from first contact to close.',
    stages: [
      { name: 'New Lead', order: 0, slaHours: 24, reminderHours: 4 },
      { name: 'First Contact', order: 1, slaHours: 48, reminderHours: 8 },
      { name: 'Proposal Sent', order: 2, slaHours: 72, reminderHours: 24 },
      { name: 'Negotiation', order: 3, slaHours: 120, reminderHours: 48 },
      { name: 'Closed Won', order: 4 },
    ],
  },
  {
    key: 'client_onboarding',
    name: 'Client Onboarding',
    description: 'Get a new client from signed contract to live.',
    stages: [
      { name: 'Welcome & Kickoff', order: 0, slaHours: 24 },
      { name: 'Collect Requirements', order: 1, slaHours: 72 },
      { name: 'Setup & Config', order: 2, slaHours: 120 },
      { name: 'Training', order: 3, slaHours: 48 },
      { name: 'Go Live', order: 4, requiresApproval: true },
    ],
  },
  {
    key: 'service_delivery',
    name: 'Service Delivery',
    description: 'Deliver a service from request to completion.',
    stages: [
      { name: 'Request Received', order: 0, slaHours: 8 },
      { name: 'Assigned', order: 1, slaHours: 24 },
      { name: 'In Progress', order: 2, slaHours: 72 },
      { name: 'QA / Review', order: 3, slaHours: 24, requiresApproval: true },
      { name: 'Delivered', order: 4 },
    ],
  },
  {
    key: 'invoice_followup',
    name: 'Invoice Follow-up',
    description: 'Track invoices from issued to paid.',
    stages: [
      { name: 'Issued', order: 0 },
      { name: 'Reminder 1', order: 1, slaHours: 168, reminderHours: 24 },
      { name: 'Reminder 2', order: 2, slaHours: 168, reminderHours: 24 },
      { name: 'Escalated', order: 3, slaHours: 72, requiresApproval: true },
      { name: 'Paid', order: 4 },
    ],
  },
  {
    key: 'support_ticket',
    name: 'Support Ticket',
    description: 'Resolve customer support tickets.',
    stages: [
      { name: 'New', order: 0, slaHours: 4 },
      { name: 'Triaged', order: 1, slaHours: 8 },
      { name: 'In Progress', order: 2, slaHours: 24 },
      { name: 'Awaiting Customer', order: 3, slaHours: 48 },
      { name: 'Resolved', order: 4 },
    ],
  },
  {
    key: 'approval_request',
    name: 'Approval Request',
    description: 'Route a decision through reviewers.',
    stages: [
      { name: 'Submitted', order: 0, slaHours: 8 },
      { name: 'Under Review', order: 1, slaHours: 24, requiresApproval: true },
      { name: 'Approved', order: 2 },
    ],
  },
  {
    key: 'staff_onboarding',
    name: 'Staff Onboarding',
    description: 'Bring a new team member up to speed.',
    stages: [
      { name: 'Offer Accepted', order: 0 },
      { name: 'Paperwork', order: 1, slaHours: 48 },
      { name: 'Tools & Accounts', order: 2, slaHours: 48 },
      { name: 'Orientation', order: 3, slaHours: 24 },
      { name: 'First Project', order: 4 },
    ],
  },
  {
    key: 'project_delivery',
    name: 'Project Delivery',
    description: 'Ship a client project end-to-end.',
    stages: [
      { name: 'Planning', order: 0, slaHours: 48 },
      { name: 'Execution', order: 1, slaHours: 240 },
      { name: 'Review', order: 2, slaHours: 48, requiresApproval: true },
      { name: 'Delivered', order: 3 },
    ],
  },
  {
    key: 'recruitment',
    name: 'Recruitment Pipeline',
    description: 'Hire from applicant to offer.',
    stages: [
      { name: 'Applied', order: 0 },
      { name: 'Screening', order: 1, slaHours: 48 },
      { name: 'Interview', order: 2, slaHours: 120 },
      { name: 'Offer', order: 3, slaHours: 48, requiresApproval: true },
      { name: 'Hired', order: 4 },
    ],
  },
  {
    key: 'inventory_request',
    name: 'Inventory Request',
    description: 'Process an internal stock / supply request.',
    stages: [
      { name: 'Requested', order: 0, slaHours: 8 },
      { name: 'Approved', order: 1, slaHours: 24, requiresApproval: true },
      { name: 'Procured', order: 2, slaHours: 72 },
      { name: 'Delivered', order: 3 },
    ],
  },
];

export function getTemplate(key: string) {
  return WORKFLOW_TEMPLATES.find((t) => t.key === key);
}
