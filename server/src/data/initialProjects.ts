export interface IProjectData {
  _id?: string;
  title: string;
  slug: string;
  description: string;
  detailedDescription: string;
  category: string;
  image: string;
  technologies: string[];
  keyFeatures: string[];
  githubUrl: string;
  liveDemoUrl: string;
  featured: boolean;
  isPublished: boolean;
  isPlaceholder: boolean;
  order: number;
}

export const initialProjects: IProjectData[] = [
  {
    title: 'Hotel Menu Management System',
    slug: 'hotel-menu-management-system',
    description: 'A project focused on displaying and managing menu items.',
    detailedDescription: 'A full-stack learning project designed for exploring digitized dining catalogs, categorizing dishes (Starters, Mains, Desserts, Beverages), and testing real-time item status toggling.',
    category: 'Full Stack',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    technologies: ['React', 'Node.js', 'Express.js', 'MongoDB', 'Tailwind CSS'],
    keyFeatures: [
      'Digital catalog display for customer browsing',
      'Menu item categorization (Starters, Mains, Desserts, Drinks)',
      'Availability status updates',
      'REST API endpoints for dish retrieval and updates',
      'Responsive interface for mobile and desktop screens',
    ],
    githubUrl: '', // Editable placeholder: hide until Kapil provides actual repo
    liveDemoUrl: '', // Editable placeholder: hide until deployed live
    featured: true,
    isPublished: true,
    isPlaceholder: true,
    order: 1,
  },
  {
    title: 'Personal Developer Portfolio',
    slug: 'personal-developer-portfolio',
    description: 'A responsive portfolio presenting my skills, learning journey, and projects.',
    detailedDescription: 'Engineered with React, TypeScript, Tailwind CSS, and Node.js Express REST API. Showcases my academic foundation at LBEF College, hands-on learning projects, technical capabilities, and internship readiness.',
    category: 'Full Stack',
    image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
    technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Express.js', 'MongoDB'],
    keyFeatures: [
      'Minimalist dark palette (#0B0D14, #121624, #6366F1, #8B5CF6, #38BDF8)',
      'RESTful contact message pipeline with rate-limiting and validation',
      'Dynamic project filtering by technology and category',
      'Honest representation of learning goals and academic background',
      'Fully responsive across mobile, tablet, and desktop',
    ],
    githubUrl: 'https://github.com/kapilshah', // Kapil's GitHub profile
    liveDemoUrl: '',
    featured: true,
    isPublished: true,
    isPlaceholder: false,
    order: 2,
  },
  {
    title: 'Student Management System',
    slug: 'student-management-system',
    description: 'A learning project for managing student records and related information.',
    detailedDescription: 'An academic records exploration project tracking student enrollment data, course allocations, and semester GPA tracking, demonstrating object-oriented architecture and database integration.',
    category: 'System',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    technologies: ['Java', 'MySQL', 'Node.js', 'Express.js'],
    keyFeatures: [
      'Student profile record management and enrollment details',
      'Course allocation and semester GPA tracking',
      'Attendance and record summary views',
      'Relational database schema with clean foreign key associations',
    ],
    githubUrl: '', // Editable placeholder
    liveDemoUrl: '', // Editable placeholder
    featured: true,
    isPublished: true,
    isPlaceholder: true,
    order: 3,
  },
  {
    title: 'Full-Stack Task Management Application',
    slug: 'full-stack-task-management',
    description: 'A web application for managing tasks, tracking progress, and organizing work.',
    detailedDescription: 'Built to practice full CRUD operations, task prioritization, status updates (To Do, In Progress, Done), and RESTful API consumption in a collaborative productivity workflow.',
    category: 'Full Stack',
    image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1200&q=80',
    technologies: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'REST APIs'],
    keyFeatures: [
      'Task creation, status progression, and priority tagging',
      'Filter and search by technology stack and urgency',
      'Clean state transitions and responsive board interface',
      'Backend REST API for task persistence',
    ],
    githubUrl: '', // Editable placeholder
    liveDemoUrl: '', // Editable placeholder
    featured: true,
    isPublished: true,
    isPlaceholder: true,
    order: 4,
  },
];
