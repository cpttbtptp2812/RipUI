import { RipNode } from './types';

export interface DecompiledComponent {
  id: string;
  name: string;
  category: 'Button' | 'Card' | 'Navbar' | 'Modal' | 'Form' | 'Other';
  tagName: string;
  pageRoute: string;
  node: RipNode;
  reactCode: string;
  vueCode: string;
  htmlCode: string;
  capturedAt: number;
}

export interface DecompiledPage {
  id: string;
  title: string;
  url: string;
  route: string;
  components: DecompiledComponent[];
  capturedAt: number;
}

export interface DecompiledProject {
  id: string;
  name: string;
  domain: string;
  createdAt: number;
  updatedAt: number;
  pages: DecompiledPage[];
  globalComponents: DecompiledComponent[];
}

export interface RecordingState {
  isRecording: boolean;
  projectId: string;
  projectName: string;
  capturedCount: number;
  currentPageTitle: string;
  currentPageRoute: string;
}
