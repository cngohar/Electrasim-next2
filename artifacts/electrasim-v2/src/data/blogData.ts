export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: 'App Update' | 'Beginner Guide' | 'Electrical Safety' | 'Tutorial';
  date: string;
  readTime: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  content: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    slug: 'electrasim-v1-6-dark-mode-rcbos',
    title: 'ElectraSim v1.6: Dark Mode, RCBOs, and Smarter Switching',
    excerpt: 'Explore the latest major update to ElectraSim, introducing eye-friendly Dark Mode, comprehensive Residual Current Breaker with Overcurrent protection (RCBO) modules, and enhanced orthogonal wire routing.',
    category: 'App Update',
    date: 'August 2, 2026',
    readTime: '4 min read',
    author: {
      name: 'Alex Rivera',
      role: 'Lead Electronics Engineer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
    },
    content: [
      'We are thrilled to announce **ElectraSim v1.6**! This release brings some of our most requested features from electrical educators and DIY enthusiasts alike.',
      '### What is New in v1.6?',
      '**1. Dark Canvas Mode**\nWhether you are working late at night or prefer a sleek modern interface, our new Dark Canvas mode reduces eye strain and makes glowing circuit wires stand out with crisp luminosity.',
      '**2. RCBO & RCD Component Library**\nWe have added Residual Current Circuit Breakers with Overcurrent protection (RCBO) and Residual Current Devices (RCD). Now you can simulate real-world earth leakage faults, trip curves, and test buttons directly in your interactive circuits.',
      '**3. Smarter Orthogonal Routing Engine**\nWire routing has been upgraded with collision-avoidance algorithms. Wires now automatically navigate around switches, junction boxes, and loads with zero clutter.',
      '### Try It Out Now',
      'Jump directly into the interactive workbench to test out the new RCBO protection devices and see the new dark mode canvas in action!'
    ]
  },
  {
    id: '2',
    slug: 'how-does-a-push-button-switch-work',
    title: 'How Does a Push Button Switch Work in Household & Control Circuits?',
    excerpt: 'Learn the underlying principles of normally open (NO) and normally closed (NC) push buttons, momentary contacts, and latching relay logic.',
    category: 'Beginner Guide',
    date: 'July 28, 2026',
    readTime: '6 min read',
    author: {
      name: 'David Chen',
      role: 'Electrical Curriculum Specialist',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
    },
    content: [
      'Push button switches are ubiquitous in both residential doorbell circuits and industrial motor control panels. But how do they function mechanically and electrically?',
      '### Normally Open (NO) vs. Normally Closed (NC)',
      'At the core of every push button switch are electrical contacts operated by an internal spring mechanism:',
      '- **Normally Open (NO):** In its idle state, the contacts are separated, blocking current flow. Pressing the button closes the contact, completing the circuit.',
      '- **Normally Closed (NC):** In its idle state, the contacts touch and conduct current. Pressing the button breaks the contact, stopping current.',
      '### Momentary vs. Latching Switch Logic',
      'A **momentary** push button maintains its state only while pressure is continuously applied (like a doorbell or horn). Once released, the internal spring returns the contacts to their normal state.',
      'A **latching** switch changes state with the first press and stays in that state until pressed again (like a power button on an appliance).',
      '### Testing in ElectraSim',
      'In ElectraSim v2, you can drop both NO and NC push buttons into your circuit. Combine them with a relay or contactor to build self-latching motor control circuits safely on screen!'
    ]
  },
  {
    id: '3',
    slug: 'why-do-my-lights-flicker',
    title: 'Why Do My Lights Flicker? Common Household Wiring Faults Explained',
    excerpt: 'Diagnose flickering lights, loose neutral connections, voltage drops, and overloaded circuits with interactive simulation examples.',
    category: 'Electrical Safety',
    date: 'July 15, 2026',
    readTime: '8 min read',
    author: {
      name: 'Sarah Jenkins',
      role: 'Master Electrician & Educator',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'
    },
    content: [
      'Flickering lights are more than just a nuisance—they can be a warning sign of underlying electrical hazards in home wiring.',
      '### 1. Loose Neutral Connection',
      'A floating or loose neutral wire causes voltage imbalance across split-phase or multi-wire branch circuits. When heavy loads turn on, the line voltage fluctuates dramatically, making lights flicker bright and dim.',
      '### 2. High Current Inrush Loads',
      'When heavy appliances like air conditioners, motors, or refrigerators start up, they draw an initial inrush current up to 6 times their normal running current. This creates a temporary voltage dip on the circuit.',
      '### 3. Arcing at Switches or Terminals',
      'Worn switch contacts or poorly tightened screw terminals can cause micro-arcing. This intermittent contact creates high resistance and erratic current flow.',
      '### Simulating Loose Neutrals in ElectraSim',
      'You can use the ElectraSim Fault Injection panel to simulate high-resistance neutrals and loose terminals to observe real-time voltage variations across loads.'
    ]
  },
  {
    id: '4',
    slug: 'understanding-two-way-switch-wiring',
    title: 'Understanding Two-Way Switch Wiring (Staircase Circuit)',
    excerpt: 'A comprehensive step-by-step visual breakdown of two-way switching using strappers, common terminals, and intermediate switches.',
    category: 'Tutorial',
    date: 'June 30, 2026',
    readTime: '7 min read',
    author: {
      name: 'Alex Rivera',
      role: 'Lead Electronics Engineer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
    },
    content: [
      'Two-way switching allows a single light or load to be controlled independently from two different locations—such as the top and bottom of a staircase or both ends of a hallway.',
      '### How Two-Way Switches Function',
      'Unlike a standard 1-way single pole single throw (SPST) switch which simply opens or closes a gap, a 2-way switch is a **Single Pole Double Throw (SPDT)** device.',
      'It has three terminals:',
      '- **COM (Common):** The pivot point terminal.',
      '- **L1 & L2:** The two output contacts (connected to traveler/strapper wires).',
      '### The Strapping Principle',
      'Two SPDT switches are connected together via two traveler wires running between their L1 and L2 terminals. Current can only reach the light when both switches direct the circuit along the same traveler line.',
      '### Interactive Simulation',
      'Open the ElectraSim sandbox and select the "2-Way Staircase Circuit" template to toggle either switch and watch how current switches between L1 and L2 strapper lines in real time!'
    ]
  },
  {
    id: '5',
    slug: 'mcb-vs-rcd-vs-rcbo-protection-guide',
    title: 'MCB vs RCD vs RCBO: Choosing the Right Protection Device',
    excerpt: 'Understand the fundamental differences between Miniature Circuit Breakers, Residual Current Devices, and Combined Protection.',
    category: 'Electrical Safety',
    date: 'June 18, 2026',
    readTime: '5 min read',
    author: {
      name: 'Sarah Jenkins',
      role: 'Master Electrician & Educator',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'
    },
    content: [
      'Circuit protection devices are essential for preventing electrical fires, equipment damage, and fatal electric shocks. Here is a quick reference guide to the three main types:',
      '### MCB (Miniature Circuit Breaker)',
      'Protecting against **overcurrent** (overload) and **short circuits**. MCBs trip when current exceeds the rated ampacity (e.g. 16A or 32A) using thermal bimetallic strips and magnetic coils.',
      '### RCD (Residual Current Device)',
      'Protecting against **earth leakage** and electric shock. RCDs continuously compare current flowing out through Live and returning through Neutral. If a leakage as low as 30mA escapes to earth, the RCD trips within milliseconds.',
      '### RCBO (Residual Current Breaker with Overcurrent)',
      'Combines both **MCB** and **RCD** functionality into a single compact unit. It guards against overload, short circuit, and earth leakage simultaneously on individual dedicated circuits.'
    ]
  }
];
