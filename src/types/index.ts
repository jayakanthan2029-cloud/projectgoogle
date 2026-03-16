export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  status: 'draft' | 'building' | 'deployed';
  deploymentUrl?: string;
  repoUrl?: string;
  files: ProjectFile[];
}

export interface ProjectFile {
  path: string;
  content: string;
  type: 'file' | 'directory';
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error';
  content: string;
  timestamp: number;
}
