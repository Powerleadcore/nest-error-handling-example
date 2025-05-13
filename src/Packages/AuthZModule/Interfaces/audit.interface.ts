// Define interfaces for the audit logs
export interface BaseAuditLog {
  method: string;
  resource: string;
  userId: string;
  result: 'deny' | 'allow';
  message: string; // Explanation of the authorization result
}

export interface PermissionAuditLog extends BaseAuditLog {
  action: string;
}

export interface RelationshipAuditLog extends BaseAuditLog {
  relationship: string;
}

export interface ResourceActionAuditLog extends BaseAuditLog {
  action: string;
  resourceId: string;
}

export interface AccessLevelAuditLog extends BaseAuditLog {
  action: string;
  accessLevels: string[] | null;
}

export type AuditLog = BaseAuditLog | PermissionAuditLog | RelationshipAuditLog | ResourceActionAuditLog | AccessLevelAuditLog;