# Usage Examples

This guide provides detailed examples of using Agilai for real-world projects.

## Table of Contents

- [Starting a New Project](#starting-a-new-project)
- [Adding Features to Existing Projects](#adding-features-to-existing-projects)
- [Complex Multi-Phase Projects](#complex-multi-phase-projects)
- [Quick Tasks and Updates](#quick-tasks-and-updates)

## Starting a New Project

This example shows the complete flow for starting a new app from scratch.

### Example: Family Chore Tracking App

````bash
$ npm run agilai
Which assistant should we launch? (Claude / Codex / Opencode): claude

🎯 Starting Agilai Orchestrator...
📡 MCP Server: agilai-orchestrator
🤖 Agent: Agilai Orchestrator
💬 Type your project idea to begin!

Welcome! I'm here to help you build your project.
What would you like to create?

> I need an app for tracking family chores

Great! Let's figure this out together.
Who will be using this app?

> Parents and kids, ages 8 and up

Perfect. What does success look like?

> Everyone knows their tasks and chores actually get done

Makes sense. Any constraints I should know about?
(Budget, timeline, technical preferences?)

> Need it in 3 months, prefer mobile-first

📋 Let me summarize what I understand:

**Project**: Family Chore Tracking App
**Users**: Parents & children (8+)
**Goal**: Clear task visibility and completion
**Timeline**: 3 months
**Platform**: Mobile-first

Is this correct? (y/n/edit)

> y

Perfect! Based on this, here's a 12-week development plan:

**Phase 1 (Weeks 1-4): Core Features**
- Task creation and assignment
- User profiles (parent/child roles)
- Basic completion tracking

**Phase 2 (Weeks 5-8): Engagement**
- Reward points system
- Notifications
- Progress visualization

**Phase 3 (Weeks 9-12): Polish**
- Testing and refinement
- Performance optimization
- User onboarding flow

Does this approach work for you? (y/n/modify)

> y

Excellent! Now for the technical approach.

**Recommended Stack**:
- Mobile: React Native (iOS + Android from one codebase)
- Backend: Firebase (real-time sync, authentication)
- Database: Firestore (flexible, scalable)
- Hosting: Firebase Hosting

**Why this stack?**
- Faster development (built-in features)
- Real-time updates (perfect for family coordination)
- Lower cost to start
- Easy to scale later

Sound good, or prefer something else? (y/n/modify)

> Sounds perfect

Great! Let me break this into specific tasks.

**Epic 1: Task Management** (3-4 weeks)
Story 1.1: Create and edit tasks ← Let's start here
Story 1.2: Assign tasks to family members
Story 1.3: Mark tasks complete

**Epic 2: User System** (2-3 weeks)
Story 2.1: Family member profiles
Story 2.2: Parent/child permissions

**Epic 3: Rewards** (2 weeks)
Story 3.1: Point tracking
Story 3.2: Rewards redemption

Ready to start with Story 1.1? (y/n)

> y

Perfect! Here's your first feature to build:

**Story 1.1: Create and Edit Tasks**

**What users can do**:
- Tap "+" to create new task
- Enter: task name, description, points (1-5)
- Optionally set due date
- Save and see task in list immediately

**Technical Implementation**:

1. **Component**: `TaskForm.jsx`
   ```javascript
   // Key fields
   - taskName (required)
   - description (optional)
   - points (1-5, default: 3)
   - dueDate (optional)
   ```

2. **Firestore Structure**:
   ```javascript
   tasks/{taskId}
   {
     name: string,
     description: string,
     points: number,
     dueDate: timestamp,
     createdBy: userId,
     assignedTo: userId,
     status: 'pending' | 'in-progress' | 'complete',
     createdAt: timestamp
   }
   ```

3. **Implementation Steps**:
   - [ ] Create TaskForm component
   - [ ] Add form validation
   - [ ] Implement Firestore write
   - [ ] Add real-time listener
   - [ ] Show success/error feedback

**Acceptance Criteria**:
- ✓ Can create task with all fields
- ✓ Task appears instantly in list
- ✓ Empty names are prevented
- ✓ Handles offline gracefully

**Testing**:
- Create task with all fields → appears in list
- Try empty name → shows validation error
- Create while offline → syncs when back online

Want the complete code examples or ready to implement? (code/ready)

> ready

Awesome! When you're done, let me know and I'll help you:
- Review the implementation
- Add tests
- Move to the next story

Type 'done' when ready for review, or 'help' if you get stuck.
````

### Behind the Scenes

While you had this natural conversation, Agilai automatically generated:

```
my-project/
├── docs/
│   ├── brief.md                 # Project context from analyst
│   ├── prd.md                   # Development plan from PM
│   ├── architecture.md          # Technical decisions from architect
│   ├── epics/
│   │   ├── epic-1-task-mgmt.md
│   │   ├── epic-2-user-system.md
│   │   └── epic-3-rewards.md
│   └── stories/
│       ├── story-1-1-create-tasks.md
│       ├── story-1-2-assign-tasks.md
│       └── story-1-3-complete-tasks.md
└── .agilai/
    ├── state.json               # Current phase and context
    └── conversation.log         # Full conversation history
```

**You never had to:**

- Learn BMAD methodology
- Know about PRDs or architectures
- Understand epics vs stories
- Figure out how to structure the project

**Agilai handled all of that invisibly** while keeping the conversation natural.

## Adding Features to Existing Projects

This example shows how to add a feature to an existing app.

### Example: Push Notifications

````bash
$ npx agilai chat --project ./my-app

I see you have an existing project. What would you like to add?

> I need to add push notifications

Perfect! Let me understand what you need.

What should trigger these notifications?

> When a task is assigned or due soon

Great. Who should receive them?

> The person assigned to the task

Makes sense. Any preferences on implementation?

> Use Firebase Cloud Messaging

📋 Here's what I'll help you build:

**Feature**: Push Notifications
**Triggers**:
  - Task assigned to user
  - Task due in 24 hours
**Recipients**: Assigned user only
**Technology**: Firebase Cloud Messaging (FCM)

Correct? (y/n)

> y

Perfect! This will integrate with your existing Firebase setup.

**Story: Push Notifications for Tasks**

**Implementation Plan**:

1. **FCM Setup** (30 minutes)
   - Add FCM to React Native
   - Request notification permissions
   - Store device tokens in Firestore

2. **Cloud Function Triggers** (1 hour)
   - Trigger on task assignment
   - Trigger on approaching due date
   - Send to user's registered devices

3. **In-App Handling** (30 minutes)
   - Handle notification tap
   - Navigate to task details
   - Update UI accordingly

**Files to Modify**:
- `src/services/notifications.js` (new)
- `functions/index.js` (add triggers)
- `src/screens/TaskList.jsx` (handle taps)
- `app.json` (FCM config)

Want detailed code for each step? (y/n)

> y

**Step 1: FCM Setup**

Create `src/services/notifications.js`:

```javascript
import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';

export async function requestNotificationPermission(userId) {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    const token = await messaging().getToken();

    // Store token in Firestore
    await firestore()
      .collection('users')
      .doc(userId)
      .update({
        fcmTokens: firestore.FieldValue.arrayUnion(token)
      });

    return token;
  }

  return null;
}

export function onNotificationTap(navigation) {
  messaging().onNotificationOpenedApp(remoteMessage => {
    const { taskId } = remoteMessage.data;
    navigation.navigate('TaskDetails', { taskId });
  });
}
````

**Step 2: Cloud Functions**

Add to `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Trigger on task assignment
exports.onTaskAssigned = functions.firestore
  .document('tasks/{taskId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    // Check if assignedTo changed
    if (newData.assignedTo !== oldData.assignedTo && newData.assignedTo) {
      const userId = newData.assignedTo;

      // Get user's FCM tokens
      const userDoc = await admin.firestore().collection('users').doc(userId).get();

      const tokens = userDoc.data().fcmTokens || [];

      // Send notification
      const message = {
        notification: {
          title: 'New Task Assigned',
          body: `You've been assigned: ${newData.name}`,
        },
        data: {
          taskId: context.params.taskId,
          type: 'task_assigned',
        },
        tokens: tokens,
      };

      await admin.messaging().sendMulticast(message);
    }
  });

// Trigger for tasks due soon (runs daily at 9 AM)
exports.notifyDueTasks = functions.pubsub
  .schedule('0 9 * * *')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const tasksSnapshot = await admin
      .firestore()
      .collection('tasks')
      .where('status', '!=', 'complete')
      .where('dueDate', '<=', tomorrow)
      .get();

    const notifications = [];

    for (const taskDoc of tasksSnapshot.docs) {
      const task = taskDoc.data();

      if (!task.assignedTo) continue;

      const userDoc = await admin.firestore().collection('users').doc(task.assignedTo).get();

      const tokens = userDoc.data().fcmTokens || [];

      if (tokens.length > 0) {
        notifications.push({
          notification: {
            title: 'Task Due Soon',
            body: `"${task.name}" is due in 24 hours`,
          },
          data: {
            taskId: taskDoc.id,
            type: 'task_due_soon',
          },
          tokens: tokens,
        });
      }
    }

    // Send all notifications
    await Promise.all(notifications.map((msg) => admin.messaging().sendMulticast(msg)));
  });
```

**Step 3: In-App Integration**

Update `App.jsx`:

```javascript
import { useEffect } from 'react';
import { onNotificationTap, requestNotificationPermission } from './services/notifications';

function App() {
  const { user, navigation } = useAuth();

  useEffect(() => {
    if (user) {
      // Request permission and store token
      requestNotificationPermission(user.uid);

      // Handle notification taps
      onNotificationTap(navigation);
    }
  }, [user]);

  // Rest of app...
}
```

**Step 4: Configuration**

Update `app.json`:

```json
{
  "expo": {
    "plugins": [
      "@react-native-firebase/app",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff"
        }
      ]
    ]
  }
}
```

Once you're done implementing, I'll help you test it thoroughly!

**Testing checklist**:

- [ ] Request notification permission → granted
- [ ] Assign task → notification appears
- [ ] Tap notification → opens task details
- [ ] Task due in 24h → receives reminder
- [ ] Multiple devices → all receive notifications

```

### Generated Documentation

For this feature addition, Agilai created:

```

my-app/
└── docs/
└── features/
└── push-notifications.md # Complete implementation spec

```

## Complex Multi-Phase Projects

For larger projects, Agilai guides you through all BMAD phases:

### The Complete Flow

```

User: "I want to build a social marketplace app"
↓
[Analyst Phase]
→ Gathers requirements through conversation
→ Creates docs/brief.md
↓
[PM Phase]
→ Develops product roadmap
→ Creates docs/prd.md with epics
↓
[Architect Phase]
→ Designs technical architecture
→ Creates docs/architecture.md
↓
[Scrum Master Phase]
→ Breaks epics into stories
→ Creates docs/stories/\*.md
↓
[Development Phase]
→ Guides implementation story by story
→ Reviews code and provides feedback
↓
[QA Phase]
→ Validates implementation
→ Suggests test coverage improvements
↓
[UX Phase]
→ Reviews user experience
→ Suggests UI/UX improvements
↓
[PO Phase]
→ Final validation against requirements
→ Prepares for launch

```

**All phases happen through natural conversation** - you never need to explicitly invoke them.

## Quick Tasks and Updates

For simple tasks, Agilai uses the Quick Lane for rapid completion:

### Example: Bug Fixes

```

You: "The login button styling is broken on mobile"
AI: I see - that's a quick fix. Let me help you resolve that.
[Generates focused fix documentation]
[2-3 minutes vs 15 minutes for full BMAD flow]

```

### Example: Configuration Changes

```

You: "Need to add a new environment variable for the API key"
AI: Got it - straightforward config update.
[Provides specific implementation steps]
[Quick lane selected automatically]

````

### Quick Lane vs Complex Lane

Agilai automatically routes tasks based on complexity:

**Quick Lane** (2-3 minutes):
- Bug fixes
- Configuration changes
- Documentation updates
- Simple feature additions

**Complex Lane** (10-15 minutes):
- New features requiring design
- Architectural changes
- Multi-component features
- Features requiring user stories

You never have to choose - **the system detects complexity automatically**.

## Multi-Project Management

Agilai maintains separate contexts for different projects:

```bash
# Work on project A
cd project-a
npm run agilai
# Context: Project A state

# Switch to project B
cd ../project-b
npm run agilai
# Context: Project B state (completely separate)
````

Each project has its own:

- `.agilai/state.json` - Current phase and progress
- `docs/` - Generated documentation
- Conversation history

## Resuming Work

Agilai remembers where you left off:

```bash
$ npm run agilai

Welcome back! Last time we were working on:
- Story 1.2: Assign Tasks to Family Members
- Status: Implementation in progress

Would you like to:
1. Continue with Story 1.2
2. Review what we've built so far
3. Move to a different story
4. Start something new

Your choice: █
```

State persistence means you can:

- Stop anytime
- Resume later
- Switch between projects
- Never lose context

## Next Steps

- **[Installation Guide](installation-methods.md)** - Complete installation options
- **[Configuration Guide](configuration.md)** - Advanced configuration
- **[MCP Management](mcp-management.md)** - Extend with tools and integrations
- **[Architecture](../docs/core-architecture.md)** - How Agilai works internally
