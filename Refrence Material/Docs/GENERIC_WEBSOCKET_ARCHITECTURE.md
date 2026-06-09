# Generic WebSocket Architecture
## Echooo Real-Time Notification System

**Version:** 2.0  
**Date:** December 12, 2025  
**Purpose:** Universal real-time infrastructure for ALL platform features

---

## 1. Design Principles

### Why Generic Architecture?

The WebSocket infrastructure must support:
- **50+ different event types** across 12 categories
- **Multiple scopes**: User, Company, Campaign, Room
- **Different delivery patterns**: Broadcast, Targeted, Presence
- **Future extensibility**: Add new event types without code changes

### Core Principles

1. **Channel-Based** - Subscribe to topics, not endpoints
2. **Event-Agnostic** - Core doesn't know about specific events
3. **Scope-Aware** - User, Company, Campaign, Room levels
4. **Pluggable** - Add new event types via configuration
5. **Redis-Ready** - Scale to multiple servers seamlessly

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GENERIC WEBSOCKET ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         CLIENT LAYER                                   │ │
│  │                                                                        │ │
│  │   Dashboard    Campaign    Outreach    Settings    Influencer         │ │
│  │      │            │           │           │            │              │ │
│  │      └────────────┴───────────┴───────────┴────────────┘              │ │
│  │                              │                                         │ │
│  │                              ▼                                         │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐ │ │
│  │  │              RealtimeContext (Single Connection)                  │ │ │
│  │  │                                                                   │ │ │
│  │  │  • One WebSocket per user session                                │ │ │
│  │  │  • Manages all subscriptions                                     │ │ │
│  │  │  • Routes events to handlers                                     │ │ │
│  │  └──────────────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    │ WebSocket                               │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                       CONNECTION LAYER                                 │ │
│  │                                                                        │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐ │ │
│  │  │                   ConnectionManager                               │ │ │
│  │  │                                                                   │ │ │
│  │  │  connections = {                                                  │ │ │
│  │  │    "user:uuid-1": WebSocket,     # User-level connection         │ │ │
│  │  │    "user:uuid-2": WebSocket,                                     │ │ │
│  │  │  }                                                                │ │ │
│  │  │                                                                   │ │ │
│  │  │  subscriptions = {                                                │ │ │
│  │  │    "company:uuid-1": {"user:uuid-1", "user:uuid-2"},            │ │ │
│  │  │    "campaign:uuid-5": {"user:uuid-1"},                          │ │ │
│  │  │    "user:uuid-1": {"user:uuid-1"},  # Personal notifications    │ │ │
│  │  │  }                                                                │ │ │
│  │  └──────────────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        CHANNEL LAYER                                   │ │
│  │                                                                        │ │
│  │  Channel Types:                                                        │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐     │ │
│  │  │    User     │ │   Company   │ │  Campaign   │ │    Room     │     │ │
│  │  │  (private)  │ │ (all team)  │ │ (campaign   │ │   (chat/    │     │ │
│  │  │             │ │             │ │  members)   │ │  collab)    │     │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘     │ │
│  │                                                                        │ │
│  │  Channel Format: {scope}:{id}                                         │ │
│  │  Examples:                                                             │ │
│  │    • user:550e8400-e29b-41d4-a716-446655440000                        │ │
│  │    • company:7c9e6679-7425-40de-944b-e07fc1f90ae7                     │ │
│  │    • campaign:123e4567-e89b-12d3-a456-426614174000                    │ │
│  │    • room:chat-campaign-123                                           │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         EVENT LAYER                                    │ │
│  │                                                                        │ │
│  │  Event Structure (Generic):                                            │ │
│  │  {                                                                     │ │
│  │    "id": "evt_xxx",              // Unique event ID                   │ │
│  │    "type": "quota.updated",      // Namespaced event type            │ │
│  │    "channel": "company:uuid",    // Target channel                    │ │
│  │    "data": { ... },              // Event-specific payload           │ │
│  │    "metadata": {                                                       │ │
│  │      "timestamp": "2025-...",                                         │ │
│  │      "triggered_by": "user:uuid",                                     │ │
│  │      "correlation_id": "xxx"                                          │ │
│  │    }                                                                   │ │
│  │  }                                                                     │ │
│  │                                                                        │ │
│  │  Event Categories:                                                     │ │
│  │  • billing.*      (quota, subscription, payment)                      │ │
│  │  • campaign.*     (status, deadline, budget)                          │ │
│  │  • outreach.*     (message, response, agent)                          │ │
│  │  • influencer.*   (accepted, content, posted)                         │ │
│  │  • team.*         (comment, mention, task)                            │ │
│  │  • discovery.*    (search, shortlist)                                 │ │
│  │  • agent.*        (started, approval, completed)                      │ │
│  │  • analytics.*    (report, alert, milestone)                          │ │
│  │  • approval.*     (pending, granted, rejected)                        │ │
│  │  • integration.*  (connected, synced, error)                          │ │
│  │  • system.*       (maintenance, announcement)                         │ │
│  │  • payment.*      (processed, failed, refund)                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                       PUBLISHER LAYER                                  │ │
│  │                                                                        │ │
│  │  Any service can publish events:                                       │ │
│  │                                                                        │ │
│  │  QuotaService ──────┐                                                  │ │
│  │  CampaignService ───┼──► EventPublisher.publish(channel, event)       │ │
│  │  OutreachService ───┤                                                  │ │
│  │  AgentService ──────┘                                                  │ │
│  │                                                                        │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐ │ │
│  │  │                    EventPublisher                                 │ │ │
│  │  │                                                                   │ │ │
│  │  │  async def publish(channel: str, event: Event):                  │ │ │
│  │  │      # Single server: Direct broadcast                           │ │ │
│  │  │      await connection_manager.broadcast(channel, event)          │ │ │
│  │  │                                                                   │ │ │
│  │  │      # Multi-server: Publish to Redis                            │ │ │
│  │  │      # await redis.publish(channel, event.json())                │ │ │
│  │  └──────────────────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    FUTURE: REDIS PUB/SUB                               │ │
│  │                                                                        │ │
│  │     Server 1              Redis               Server 2                │ │
│  │        │                    │                    │                    │ │
│  │        │───publish──────►   │   ◄──subscribe────│                    │ │
│  │        │◄──subscribe────    │    ───subscribe──►│                    │ │
│  │        │                    │                    │                    │ │
│  │    [Users A,B]          [Broker]            [Users C,D]              │ │
│  │                                                                        │ │
│  │  • All servers subscribe to all channels                              │ │
│  │  • Event published once, delivered to all servers                     │ │
│  │  • Each server broadcasts to its connected users                      │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Channel Design

### 3.1 Channel Types & Scopes

| Scope | Format | Example | Use Case |
|-------|--------|---------|----------|
| **User** | `user:{user_id}` | `user:550e8400-...` | Personal notifications, mentions, DMs |
| **Company** | `company:{company_id}` | `company:7c9e6679-...` | Team-wide alerts, quota updates |
| **Campaign** | `campaign:{campaign_id}` | `campaign:123e4567-...` | Campaign-specific updates |
| **Room** | `room:{room_id}` | `room:chat-abc123` | Real-time collaboration, chat |
| **Global** | `global:{topic}` | `global:maintenance` | System-wide announcements |

### 3.2 Auto-Subscription Rules

```python
# When user connects, auto-subscribe to:
auto_subscriptions = [
    f"user:{user_id}",           # Personal notifications
    f"company:{company_id}",     # Company-wide updates
]

# Dynamic subscriptions (user joins/leaves):
# - campaign:{id} when viewing campaign
# - room:{id} when in chat/collab space
```

### 3.3 Permission Model

```python
# Channel access rules
CHANNEL_PERMISSIONS = {
    "user": lambda user, channel_id: user.id == channel_id,
    "company": lambda user, channel_id: user.company_id == channel_id,
    "campaign": lambda user, channel_id: user_has_campaign_access(user, channel_id),
    "room": lambda user, channel_id: user_in_room(user, channel_id),
    "global": lambda user, channel_id: True,  # Everyone can receive
}
```

---

## 4. Event Type Registry

### 4.1 Event Naming Convention

```
{category}.{action}[.{detail}]

Examples:
  billing.quota.updated
  billing.quota.warning
  billing.subscription.upgraded
  campaign.status.changed
  outreach.message.received
  team.comment.created
  agent.task.completed
```

### 4.2 Complete Event Registry

```python
# Event Type Registry
# All possible events in the system

EVENT_TYPES = {
    # =========================================================================
    # BILLING & SUBSCRIPTION
    # =========================================================================
    "billing.quota.updated": {
        "description": "Quota usage changed",
        "channels": ["company"],
        "data_schema": {
            "feature_code": str,
            "limit": int,
            "used": int,
            "remaining": int,
            "percentage_used": float,
        }
    },
    "billing.quota.warning": {
        "description": "Quota reached warning threshold",
        "channels": ["company", "user"],
        "data_schema": {
            "feature_code": str,
            "percentage_used": float,
            "threshold": int,  # 80 or 95
        }
    },
    "billing.quota.exceeded": {
        "description": "Quota limit reached",
        "channels": ["company"],
        "data_schema": {
            "feature_code": str,
            "limit": int,
        }
    },
    "billing.subscription.changed": {
        "description": "Subscription status changed",
        "channels": ["company"],
        "data_schema": {
            "action": str,  # upgraded, downgraded, cancelled, renewed
            "plan_name": str,
            "effective_date": str,
        }
    },
    "billing.payment.processed": {
        "description": "Payment successfully processed",
        "channels": ["company"],
        "data_schema": {
            "amount": float,
            "currency": str,
            "invoice_id": str,
        }
    },
    "billing.payment.failed": {
        "description": "Payment failed",
        "channels": ["company"],
        "data_schema": {
            "error": str,
            "retry_date": str,
        }
    },
    
    # =========================================================================
    # CAMPAIGN
    # =========================================================================
    "campaign.status.changed": {
        "description": "Campaign status updated",
        "channels": ["company", "campaign"],
        "data_schema": {
            "campaign_id": str,
            "campaign_name": str,
            "old_status": str,
            "new_status": str,
        }
    },
    "campaign.deadline.approaching": {
        "description": "Campaign deadline reminder",
        "channels": ["campaign", "user"],
        "data_schema": {
            "campaign_id": str,
            "campaign_name": str,
            "deadline": str,
            "days_remaining": int,
        }
    },
    "campaign.budget.alert": {
        "description": "Campaign budget threshold reached",
        "channels": ["campaign"],
        "data_schema": {
            "campaign_id": str,
            "budget_used": float,
            "budget_total": float,
            "percentage": float,
        }
    },
    "campaign.member.added": {
        "description": "Team member added to campaign",
        "channels": ["campaign"],
        "data_schema": {
            "campaign_id": str,
            "user_id": str,
            "user_name": str,
            "role": str,
        }
    },
    
    # =========================================================================
    # OUTREACH & MESSAGING
    # =========================================================================
    "outreach.message.received": {
        "description": "New message from influencer",
        "channels": ["company", "user", "campaign"],
        "data_schema": {
            "conversation_id": str,
            "influencer_id": str,
            "influencer_name": str,
            "preview": str,
            "campaign_id": str,
        }
    },
    "outreach.message.read": {
        "description": "Message read by recipient",
        "channels": ["user"],
        "data_schema": {
            "conversation_id": str,
            "read_by": str,
            "read_at": str,
        }
    },
    "outreach.bulk.progress": {
        "description": "Bulk outreach progress update",
        "channels": ["user"],
        "data_schema": {
            "batch_id": str,
            "total": int,
            "sent": int,
            "failed": int,
            "percentage": float,
        }
    },
    "outreach.response.received": {
        "description": "Influencer responded to outreach",
        "channels": ["company", "campaign"],
        "data_schema": {
            "influencer_id": str,
            "influencer_name": str,
            "response_type": str,  # accepted, declined, interested
            "campaign_id": str,
        }
    },
    
    # =========================================================================
    # INFLUENCER ACTIVITY
    # =========================================================================
    "influencer.collaboration.accepted": {
        "description": "Influencer accepted collaboration",
        "channels": ["company", "campaign"],
        "data_schema": {
            "influencer_id": str,
            "influencer_name": str,
            "campaign_id": str,
        }
    },
    "influencer.content.submitted": {
        "description": "Influencer submitted content for review",
        "channels": ["campaign"],
        "data_schema": {
            "influencer_id": str,
            "influencer_name": str,
            "content_type": str,
            "requires_approval": bool,
        }
    },
    "influencer.content.posted": {
        "description": "Influencer posted content (tracked)",
        "channels": ["company", "campaign"],
        "data_schema": {
            "influencer_id": str,
            "influencer_name": str,
            "platform": str,
            "post_url": str,
            "campaign_id": str,
        }
    },
    
    # =========================================================================
    # TEAM COLLABORATION
    # =========================================================================
    "team.comment.created": {
        "description": "New comment on campaign/influencer",
        "channels": ["campaign", "user"],
        "data_schema": {
            "comment_id": str,
            "author_id": str,
            "author_name": str,
            "target_type": str,  # campaign, influencer, content
            "target_id": str,
            "preview": str,
        }
    },
    "team.mention.received": {
        "description": "User mentioned in comment",
        "channels": ["user"],
        "data_schema": {
            "comment_id": str,
            "mentioned_by": str,
            "context": str,
            "link": str,
        }
    },
    "team.task.assigned": {
        "description": "Task assigned to user",
        "channels": ["user"],
        "data_schema": {
            "task_id": str,
            "task_title": str,
            "assigned_by": str,
            "due_date": str,
        }
    },
    "team.presence.updated": {
        "description": "Team member online status changed",
        "channels": ["company"],
        "data_schema": {
            "user_id": str,
            "user_name": str,
            "status": str,  # online, away, offline
        }
    },
    
    # =========================================================================
    # DISCOVERY & SHORTLIST
    # =========================================================================
    "discovery.search.completed": {
        "description": "Async discovery search completed",
        "channels": ["user"],
        "data_schema": {
            "search_id": str,
            "results_count": int,
            "query_summary": str,
        }
    },
    "discovery.shortlist.updated": {
        "description": "Influencer added/removed from shortlist",
        "channels": ["company", "campaign"],
        "data_schema": {
            "action": str,  # added, removed
            "influencer_id": str,
            "influencer_name": str,
            "shortlist_id": str,
            "by_user": str,
        }
    },
    
    # =========================================================================
    # AI AGENTS
    # =========================================================================
    "agent.task.started": {
        "description": "AI agent started a task",
        "channels": ["company", "user"],
        "data_schema": {
            "agent_type": str,
            "task_id": str,
            "task_description": str,
        }
    },
    "agent.approval.required": {
        "description": "AI agent needs human approval",
        "channels": ["user", "company"],
        "data_schema": {
            "agent_type": str,
            "task_id": str,
            "action_description": str,
            "approval_deadline": str,
        }
    },
    "agent.task.completed": {
        "description": "AI agent completed task",
        "channels": ["company", "user"],
        "data_schema": {
            "agent_type": str,
            "task_id": str,
            "summary": str,
            "results": dict,
        }
    },
    "agent.conversation.update": {
        "description": "AI agent conversation activity",
        "channels": ["user"],
        "data_schema": {
            "conversation_id": str,
            "influencer_name": str,
            "last_message_preview": str,
            "status": str,
        }
    },
    
    # =========================================================================
    # ANALYTICS & REPORTS
    # =========================================================================
    "analytics.report.ready": {
        "description": "Report generation completed",
        "channels": ["user"],
        "data_schema": {
            "report_id": str,
            "report_name": str,
            "download_url": str,
        }
    },
    "analytics.alert.triggered": {
        "description": "Performance alert triggered",
        "channels": ["company", "campaign"],
        "data_schema": {
            "alert_type": str,
            "metric": str,
            "threshold": float,
            "current_value": float,
            "campaign_id": str,
        }
    },
    "analytics.milestone.reached": {
        "description": "Campaign milestone reached",
        "channels": ["company", "campaign"],
        "data_schema": {
            "campaign_id": str,
            "milestone_type": str,
            "value": float,
        }
    },
    
    # =========================================================================
    # APPROVAL WORKFLOWS
    # =========================================================================
    "approval.pending": {
        "description": "Item pending approval",
        "channels": ["user"],
        "data_schema": {
            "approval_id": str,
            "item_type": str,
            "item_id": str,
            "submitted_by": str,
            "deadline": str,
        }
    },
    "approval.granted": {
        "description": "Approval granted",
        "channels": ["user", "campaign"],
        "data_schema": {
            "approval_id": str,
            "item_type": str,
            "approved_by": str,
            "comments": str,
        }
    },
    "approval.rejected": {
        "description": "Approval rejected",
        "channels": ["user"],
        "data_schema": {
            "approval_id": str,
            "item_type": str,
            "rejected_by": str,
            "reason": str,
        }
    },
    
    # =========================================================================
    # INTEGRATIONS
    # =========================================================================
    "integration.connected": {
        "description": "Social account connected",
        "channels": ["company", "user"],
        "data_schema": {
            "platform": str,
            "account_name": str,
            "connected_by": str,
        }
    },
    "integration.disconnected": {
        "description": "Social account disconnected",
        "channels": ["company"],
        "data_schema": {
            "platform": str,
            "reason": str,
        }
    },
    "integration.sync.completed": {
        "description": "Data sync completed",
        "channels": ["user"],
        "data_schema": {
            "platform": str,
            "records_synced": int,
        }
    },
    "integration.error": {
        "description": "Integration error occurred",
        "channels": ["company"],
        "data_schema": {
            "platform": str,
            "error_type": str,
            "message": str,
        }
    },
    
    # =========================================================================
    # SYSTEM
    # =========================================================================
    "system.maintenance.scheduled": {
        "description": "Scheduled maintenance notification",
        "channels": ["global"],
        "data_schema": {
            "start_time": str,
            "duration_minutes": int,
            "message": str,
        }
    },
    "system.announcement": {
        "description": "System announcement",
        "channels": ["global"],
        "data_schema": {
            "title": str,
            "message": str,
            "type": str,  # info, warning, success
        }
    },
    "system.security.alert": {
        "description": "Security alert for user",
        "channels": ["user"],
        "data_schema": {
            "alert_type": str,  # new_login, password_changed
            "details": str,
            "location": str,
        }
    },
}
```

---

## 5. Backend Implementation

### 5.1 Core Models

```python
# app/WebSocket/models.py

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum
import uuid


class ChannelScope(str, Enum):
    """Channel scope types"""
    USER = "user"
    COMPANY = "company"
    CAMPAIGN = "campaign"
    ROOM = "room"
    GLOBAL = "global"


class Channel(BaseModel):
    """Channel identifier"""
    scope: ChannelScope
    id: str
    
    @property
    def full_name(self) -> str:
        return f"{self.scope.value}:{self.id}"
    
    @classmethod
    def parse(cls, channel_str: str) -> "Channel":
        scope, id = channel_str.split(":", 1)
        return cls(scope=ChannelScope(scope), id=id)
    
    @classmethod
    def user(cls, user_id: str) -> "Channel":
        return cls(scope=ChannelScope.USER, id=user_id)
    
    @classmethod
    def company(cls, company_id: str) -> "Channel":
        return cls(scope=ChannelScope.COMPANY, id=company_id)
    
    @classmethod
    def campaign(cls, campaign_id: str) -> "Channel":
        return cls(scope=ChannelScope.CAMPAIGN, id=campaign_id)


class EventMetadata(BaseModel):
    """Event metadata"""
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    triggered_by: Optional[str] = None  # user:{id} or system
    correlation_id: Optional[str] = None
    version: str = "1.0"


class Event(BaseModel):
    """Generic event structure"""
    id: str = Field(default_factory=lambda: f"evt_{uuid.uuid4().hex[:12]}")
    type: str  # e.g., "billing.quota.updated"
    channel: str  # e.g., "company:uuid"
    data: Dict[str, Any]
    metadata: EventMetadata = Field(default_factory=EventMetadata)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ClientMessage(BaseModel):
    """Message from client to server"""
    type: str  # subscribe, unsubscribe, ping
    channel: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class ServerMessage(BaseModel):
    """Message from server to client"""
    type: str  # event, subscribed, unsubscribed, pong, error
    channel: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
```

### 5.2 Connection Manager

```python
# app/WebSocket/manager.py

from typing import Dict, Set, Optional, List
from fastapi import WebSocket
import asyncio
import json
from datetime import datetime

from .models import Event, Channel, ChannelScope


class ConnectionManager:
    """
    Generic WebSocket connection manager.
    
    Manages:
    - User connections (one per session)
    - Channel subscriptions
    - Message routing
    - Presence tracking
    """
    
    def __init__(self):
        # Active connections: user_id -> WebSocket
        self._connections: Dict[str, WebSocket] = {}
        
        # Channel subscriptions: channel -> set of user_ids
        self._subscriptions: Dict[str, Set[str]] = {}
        
        # Reverse lookup: user_id -> set of channels
        self._user_channels: Dict[str, Set[str]] = {}
        
        # User metadata
        self._user_metadata: Dict[str, Dict] = {}
        
        # Lock for thread safety
        self._lock = asyncio.Lock()
    
    # =========================================================================
    # Connection Management
    # =========================================================================
    
    async def connect(
        self,
        websocket: WebSocket,
        user_id: str,
        company_id: str,
        metadata: Optional[Dict] = None
    ) -> bool:
        """
        Accept a new WebSocket connection.
        
        Auto-subscribes to:
        - user:{user_id} (personal notifications)
        - company:{company_id} (company-wide updates)
        """
        await websocket.accept()
        
        async with self._lock:
            # Store connection
            self._connections[user_id] = websocket
            
            # Store metadata
            self._user_metadata[user_id] = {
                "company_id": company_id,
                "connected_at": datetime.utcnow().isoformat(),
                **(metadata or {})
            }
            
            # Initialize user channels set
            self._user_channels[user_id] = set()
            
            # Auto-subscribe to default channels
            await self._subscribe_internal(user_id, f"user:{user_id}")
            await self._subscribe_internal(user_id, f"company:{company_id}")
        
        # Broadcast presence update
        await self.broadcast_presence(user_id, company_id, "online")
        
        return True
    
    async def disconnect(self, user_id: str):
        """Remove a WebSocket connection and clean up subscriptions."""
        async with self._lock:
            if user_id not in self._connections:
                return
            
            # Get company for presence broadcast
            metadata = self._user_metadata.get(user_id, {})
            company_id = metadata.get("company_id")
            
            # Unsubscribe from all channels
            channels = self._user_channels.get(user_id, set()).copy()
            for channel in channels:
                await self._unsubscribe_internal(user_id, channel)
            
            # Remove connection and metadata
            del self._connections[user_id]
            self._user_channels.pop(user_id, None)
            self._user_metadata.pop(user_id, None)
        
        # Broadcast presence update
        if company_id:
            await self.broadcast_presence(user_id, company_id, "offline")
    
    # =========================================================================
    # Subscription Management
    # =========================================================================
    
    async def subscribe(
        self,
        user_id: str,
        channel: str
    ) -> bool:
        """Subscribe user to a channel."""
        async with self._lock:
            return await self._subscribe_internal(user_id, channel)
    
    async def unsubscribe(
        self,
        user_id: str,
        channel: str
    ) -> bool:
        """Unsubscribe user from a channel."""
        async with self._lock:
            return await self._unsubscribe_internal(user_id, channel)
    
    async def _subscribe_internal(self, user_id: str, channel: str) -> bool:
        """Internal subscribe (must hold lock)."""
        if channel not in self._subscriptions:
            self._subscriptions[channel] = set()
        
        self._subscriptions[channel].add(user_id)
        self._user_channels[user_id].add(channel)
        return True
    
    async def _unsubscribe_internal(self, user_id: str, channel: str) -> bool:
        """Internal unsubscribe (must hold lock)."""
        if channel in self._subscriptions:
            self._subscriptions[channel].discard(user_id)
            if not self._subscriptions[channel]:
                del self._subscriptions[channel]
        
        if user_id in self._user_channels:
            self._user_channels[user_id].discard(channel)
        
        return True
    
    # =========================================================================
    # Message Broadcasting
    # =========================================================================
    
    async def broadcast(self, channel: str, event: Event):
        """
        Broadcast event to all subscribers of a channel.
        
        This is the main method for sending notifications.
        """
        async with self._lock:
            subscribers = self._subscriptions.get(channel, set()).copy()
        
        if not subscribers:
            return
        
        # Serialize event once
        message = event.json()
        
        # Send to all subscribers
        disconnected = []
        for user_id in subscribers:
            websocket = self._connections.get(user_id)
            if websocket:
                try:
                    await websocket.send_text(message)
                except Exception as e:
                    print(f"[WebSocket] Send failed for {user_id}: {e}")
                    disconnected.append(user_id)
        
        # Clean up disconnected users
        for user_id in disconnected:
            await self.disconnect(user_id)
    
    async def broadcast_to_channels(
        self,
        channels: List[str],
        event: Event
    ):
        """Broadcast event to multiple channels."""
        # Collect unique subscribers across all channels
        async with self._lock:
            all_subscribers: Set[str] = set()
            for channel in channels:
                all_subscribers.update(
                    self._subscriptions.get(channel, set())
                )
        
        if not all_subscribers:
            return
        
        message = event.json()
        
        disconnected = []
        for user_id in all_subscribers:
            websocket = self._connections.get(user_id)
            if websocket:
                try:
                    await websocket.send_text(message)
                except Exception:
                    disconnected.append(user_id)
        
        for user_id in disconnected:
            await self.disconnect(user_id)
    
    async def send_to_user(self, user_id: str, event: Event):
        """Send event directly to a specific user."""
        websocket = self._connections.get(user_id)
        if websocket:
            try:
                await websocket.send_text(event.json())
            except Exception:
                await self.disconnect(user_id)
    
    # =========================================================================
    # Presence
    # =========================================================================
    
    async def broadcast_presence(
        self,
        user_id: str,
        company_id: str,
        status: str  # online, away, offline
    ):
        """Broadcast user presence change to company."""
        event = Event(
            type="team.presence.updated",
            channel=f"company:{company_id}",
            data={
                "user_id": user_id,
                "status": status,
            }
        )
        await self.broadcast(f"company:{company_id}", event)
    
    def get_online_users(self, company_id: str) -> List[str]:
        """Get list of online users in a company."""
        online = []
        for user_id, metadata in self._user_metadata.items():
            if metadata.get("company_id") == company_id:
                online.append(user_id)
        return online
    
    # =========================================================================
    # Stats
    # =========================================================================
    
    def get_stats(self) -> Dict:
        """Get connection statistics."""
        return {
            "total_connections": len(self._connections),
            "total_channels": len(self._subscriptions),
            "channels": {
                channel: len(subscribers)
                for channel, subscribers in self._subscriptions.items()
            }
        }


# Global singleton
connection_manager = ConnectionManager()
```

### 5.3 Event Publisher

```python
# app/WebSocket/publisher.py

from typing import List, Optional, Dict, Any
import asyncio

from .manager import connection_manager
from .models import Event, EventMetadata, Channel


class EventPublisher:
    """
    Publisher for sending events through WebSocket.
    
    Usage from any service:
    
        from app.WebSocket.publisher import event_publisher
        
        await event_publisher.publish(
            event_type="billing.quota.updated",
            channel="company:uuid",
            data={"feature_code": "campaigns", "used": 5},
            triggered_by="user:uuid"
        )
    """
    
    def __init__(self):
        self._manager = connection_manager
    
    async def publish(
        self,
        event_type: str,
        channel: str,
        data: Dict[str, Any],
        triggered_by: Optional[str] = None,
        correlation_id: Optional[str] = None
    ):
        """
        Publish an event to a channel.
        
        Args:
            event_type: Event type (e.g., "billing.quota.updated")
            channel: Target channel (e.g., "company:uuid")
            data: Event payload
            triggered_by: Who/what triggered this event
            correlation_id: For tracing related events
        """
        event = Event(
            type=event_type,
            channel=channel,
            data=data,
            metadata=EventMetadata(
                triggered_by=triggered_by,
                correlation_id=correlation_id
            )
        )
        
        await self._manager.broadcast(channel, event)
    
    async def publish_to_channels(
        self,
        event_type: str,
        channels: List[str],
        data: Dict[str, Any],
        triggered_by: Optional[str] = None
    ):
        """
        Publish an event to multiple channels.
        
        Useful for events that need to reach:
        - Company AND specific campaign
        - User AND company
        """
        # Use first channel as primary
        event = Event(
            type=event_type,
            channel=channels[0] if channels else "",
            data=data,
            metadata=EventMetadata(triggered_by=triggered_by)
        )
        
        await self._manager.broadcast_to_channels(channels, event)
    
    async def publish_to_user(
        self,
        event_type: str,
        user_id: str,
        data: Dict[str, Any],
        triggered_by: Optional[str] = None
    ):
        """Publish event directly to a specific user."""
        channel = f"user:{user_id}"
        event = Event(
            type=event_type,
            channel=channel,
            data=data,
            metadata=EventMetadata(triggered_by=triggered_by)
        )
        
        await self._manager.send_to_user(user_id, event)
    
    async def publish_to_company(
        self,
        event_type: str,
        company_id: str,
        data: Dict[str, Any],
        triggered_by: Optional[str] = None
    ):
        """Publish event to all users in a company."""
        await self.publish(
            event_type=event_type,
            channel=f"company:{company_id}",
            data=data,
            triggered_by=triggered_by
        )


# Global singleton
event_publisher = EventPublisher()


# ============================================================================
# Convenience Functions
# ============================================================================

async def emit(
    event_type: str,
    channel: str,
    data: Dict[str, Any],
    **kwargs
):
    """Shorthand for event_publisher.publish()"""
    await event_publisher.publish(event_type, channel, data, **kwargs)


async def emit_to_company(
    company_id: str,
    event_type: str,
    data: Dict[str, Any],
    **kwargs
):
    """Shorthand for publishing to company channel."""
    await event_publisher.publish_to_company(event_type, company_id, data, **kwargs)


async def emit_to_user(
    user_id: str,
    event_type: str,
    data: Dict[str, Any],
    **kwargs
):
    """Shorthand for publishing to user channel."""
    await event_publisher.publish_to_user(event_type, user_id, data, **kwargs)
```

### 5.4 Usage in Services

```python
# Example: How any service uses the WebSocket infrastructure

# ============================================================================
# QuotaService (billing)
# ============================================================================
from app.WebSocket.publisher import emit_to_company

class QuotaService:
    async def consume_quota(self, ...):
        # ... quota logic ...
        
        # Broadcast update
        await emit_to_company(
            company_id=str(company_id),
            event_type="billing.quota.updated",
            data={
                "feature_code": feature_code,
                "limit": limit,
                "used": new_used,
                "remaining": limit - new_used,
                "percentage_used": round((new_used / limit) * 100, 2)
            },
            triggered_by=f"user:{user_id}"
        )


# ============================================================================
# CampaignService
# ============================================================================
from app.WebSocket.publisher import event_publisher

class CampaignService:
    async def update_campaign_status(self, campaign_id, new_status, user_id):
        # ... update logic ...
        
        # Notify both company AND campaign channels
        await event_publisher.publish_to_channels(
            event_type="campaign.status.changed",
            channels=[
                f"company:{company_id}",
                f"campaign:{campaign_id}"
            ],
            data={
                "campaign_id": str(campaign_id),
                "campaign_name": campaign.name,
                "old_status": old_status,
                "new_status": new_status
            },
            triggered_by=f"user:{user_id}"
        )


# ============================================================================
# OutreachService
# ============================================================================
from app.WebSocket.publisher import emit_to_user, emit_to_company

class OutreachService:
    async def handle_influencer_message(self, message, conversation):
        # ... message handling ...
        
        # Notify assigned user
        await emit_to_user(
            user_id=str(conversation.assigned_to),
            event_type="outreach.message.received",
            data={
                "conversation_id": str(conversation.id),
                "influencer_id": str(message.sender_id),
                "influencer_name": influencer.name,
                "preview": message.content[:100],
                "campaign_id": str(conversation.campaign_id)
            }
        )
        
        # Also notify company (for dashboard counters)
        await emit_to_company(
            company_id=str(conversation.company_id),
            event_type="outreach.message.received",
            data={...}
        )


# ============================================================================
# AgentService (AI Agents)
# ============================================================================
from app.WebSocket.publisher import emit_to_user, emit_to_company

class AgentService:
    async def request_approval(self, agent_task, action):
        # Notify user who needs to approve
        await emit_to_user(
            user_id=str(agent_task.approval_user_id),
            event_type="agent.approval.required",
            data={
                "agent_type": agent_task.agent_type,
                "task_id": str(agent_task.id),
                "action_description": action.description,
                "approval_deadline": agent_task.deadline.isoformat()
            }
        )


# ============================================================================
# CommentService (Team Collaboration)
# ============================================================================
from app.WebSocket.publisher import event_publisher, emit_to_user

class CommentService:
    async def create_comment(self, comment, mentioned_users):
        # Notify campaign members
        await event_publisher.publish(
            event_type="team.comment.created",
            channel=f"campaign:{comment.campaign_id}",
            data={
                "comment_id": str(comment.id),
                "author_id": str(comment.author_id),
                "author_name": author.name,
                "preview": comment.content[:100]
            }
        )
        
        # Notify mentioned users individually
        for user_id in mentioned_users:
            await emit_to_user(
                user_id=str(user_id),
                event_type="team.mention.received",
                data={
                    "comment_id": str(comment.id),
                    "mentioned_by": author.name,
                    "context": comment.content[:50],
                    "link": f"/campaigns/{comment.campaign_id}#comment-{comment.id}"
                }
            )
```

---

## 6. Frontend Implementation

### 6.1 Generic Realtime Context

```typescript
// src/context/RealtimeContext.tsx

'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { useAuth } from '@/hooks/useAuth';

// ============================================================================
// Types
// ============================================================================

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

interface Event<T = any> {
  id: string;
  type: string;
  channel: string;
  data: T;
  metadata: {
    timestamp: string;
    triggered_by?: string;
    correlation_id?: string;
  };
}

type EventHandler<T = any> = (event: Event<T>) => void;

interface RealtimeContextValue {
  // Connection
  status: ConnectionStatus;
  reconnect: () => void;
  
  // Subscriptions
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
  getSubscriptions: () => string[];
  
  // Event handlers
  on: <T = any>(eventType: string, handler: EventHandler<T>) => () => void;
  off: (eventType: string, handler: EventHandler) => void;
  
  // Convenience
  onEvent: <T = any>(eventType: string, handler: EventHandler<T>) => () => void;
}

// ============================================================================
// Context
// ============================================================================

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface RealtimeProviderProps {
  children: ReactNode;
  wsUrl?: string;
}

export function RealtimeProvider({ children, wsUrl }: RealtimeProviderProps) {
  const { user, company, isAuthenticated, token } = useAuth();
  
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const socketRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, Set<EventHandler>>>(new Map());
  const subscriptionsRef = useRef<Set<string>>(new Set());
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Build WebSocket URL
  const getWsUrl = useCallback(() => {
    if (wsUrl) return wsUrl;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const protocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
    const host = apiUrl.replace(/^https?:\/\//, '');
    return `${protocol}://${host}/ws/realtime?token=${token}`;
  }, [wsUrl, token]);
  
  // ========== Connection Management ==========
  
  const connect = useCallback(() => {
    if (!isAuthenticated || !token) return;
    if (socketRef.current?.readyState === WebSocket.OPEN) return;
    
    setStatus('connecting');
    
    const socket = new WebSocket(getWsUrl());
    socketRef.current = socket;
    
    socket.onopen = () => {
      console.log('[Realtime] Connected');
      setStatus('connected');
      reconnectAttempts.current = 0;
      
      // Re-subscribe to all channels
      subscriptionsRef.current.forEach(channel => {
        socket.send(JSON.stringify({ type: 'subscribe', channel }));
      });
    };
    
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Handle server messages
        if (message.type === 'pong') return;
        if (message.type === 'subscribed' || message.type === 'unsubscribed') return;
        
        // Route event to handlers
        const eventType = message.type;
        const handlers = handlersRef.current.get(eventType);
        
        if (handlers) {
          handlers.forEach(handler => {
            try {
              handler(message);
            } catch (e) {
              console.error('[Realtime] Handler error:', e);
            }
          });
        }
        
        // Also call wildcard handlers
        const wildcardHandlers = handlersRef.current.get('*');
        if (wildcardHandlers) {
          wildcardHandlers.forEach(handler => handler(message));
        }
        
      } catch (e) {
        console.error('[Realtime] Message parse error:', e);
      }
    };
    
    socket.onclose = (event) => {
      console.log('[Realtime] Disconnected:', event.code);
      setStatus('disconnected');
      
      // Attempt reconnection (unless clean close)
      if (event.code !== 1000 && reconnectAttempts.current < 5) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;
        setStatus('reconnecting');
        
        reconnectTimeout.current = setTimeout(() => {
          connect();
        }, delay);
      }
    };
    
    socket.onerror = (error) => {
      console.error('[Realtime] Error:', error);
    };
  }, [isAuthenticated, token, getWsUrl]);
  
  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    
    if (socketRef.current) {
      socketRef.current.close(1000, 'User disconnect');
      socketRef.current = null;
    }
    
    setStatus('disconnected');
  }, []);
  
  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttempts.current = 0;
    connect();
  }, [connect, disconnect]);
  
  // ========== Subscription Management ==========
  
  const subscribe = useCallback((channel: string) => {
    subscriptionsRef.current.add(channel);
    
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'subscribe', channel }));
    }
  }, []);
  
  const unsubscribe = useCallback((channel: string) => {
    subscriptionsRef.current.delete(channel);
    
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'unsubscribe', channel }));
    }
  }, []);
  
  const getSubscriptions = useCallback(() => {
    return Array.from(subscriptionsRef.current);
  }, []);
  
  // ========== Event Handlers ==========
  
  const on = useCallback(<T = any>(
    eventType: string,
    handler: EventHandler<T>
  ): (() => void) => {
    if (!handlersRef.current.has(eventType)) {
      handlersRef.current.set(eventType, new Set());
    }
    
    handlersRef.current.get(eventType)!.add(handler as EventHandler);
    
    // Return unsubscribe function
    return () => {
      handlersRef.current.get(eventType)?.delete(handler as EventHandler);
    };
  }, []);
  
  const off = useCallback((eventType: string, handler: EventHandler) => {
    handlersRef.current.get(eventType)?.delete(handler);
  }, []);
  
  // Alias for on()
  const onEvent = on;
  
  // ========== Lifecycle ==========
  
  useEffect(() => {
    if (isAuthenticated) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [isAuthenticated, connect, disconnect]);
  
  // Heartbeat
  useEffect(() => {
    if (status !== 'connected') return;
    
    const interval = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [status]);
  
  // ========== Context Value ==========
  
  const value: RealtimeContextValue = {
    status,
    reconnect,
    subscribe,
    unsubscribe,
    getSubscriptions,
    on,
    off,
    onEvent,
  };
  
  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================

export function useRealtime(): RealtimeContextValue {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
}

/**
 * Subscribe to a specific event type
 * 
 * @example
 * useRealtimeEvent('billing.quota.updated', (event) => {
 *   console.log('Quota updated:', event.data);
 * });
 */
export function useRealtimeEvent<T = any>(
  eventType: string,
  handler: EventHandler<T>,
  deps: any[] = []
) {
  const { on } = useRealtime();
  
  useEffect(() => {
    const unsubscribe = on(eventType, handler);
    return unsubscribe;
  }, [eventType, on, ...deps]);
}

/**
 * Subscribe to a channel and optionally listen for events
 * 
 * @example
 * useChannel(`campaign:${campaignId}`, 'campaign.status.changed', (event) => {
 *   setCampaignStatus(event.data.new_status);
 * });
 */
export function useChannel<T = any>(
  channel: string,
  eventType?: string,
  handler?: EventHandler<T>
) {
  const { subscribe, unsubscribe, on } = useRealtime();
  
  useEffect(() => {
    subscribe(channel);
    return () => unsubscribe(channel);
  }, [channel, subscribe, unsubscribe]);
  
  useEffect(() => {
    if (eventType && handler) {
      return on(eventType, handler);
    }
  }, [eventType, handler, on]);
}
```

### 6.2 Feature-Specific Hooks

```typescript
// src/hooks/realtime/useQuotaUpdates.ts

import { useRealtimeEvent } from '@/context/RealtimeContext';
import { useSubscription } from '@/context/SubscriptionContext';

/**
 * Listen for quota updates
 */
export function useQuotaUpdates() {
  const { refreshSubscription } = useSubscription();
  
  useRealtimeEvent('billing.quota.updated', (event) => {
    // Update subscription context with new quota
    refreshSubscription();
  });
  
  useRealtimeEvent('billing.quota.warning', (event) => {
    // Show toast notification
    toast.warning(`${event.data.feature_code} is at ${event.data.percentage_used}%`);
  });
}

// src/hooks/realtime/useMessageNotifications.ts

import { useRealtimeEvent } from '@/context/RealtimeContext';

/**
 * Listen for new messages
 */
export function useMessageNotifications(
  onNewMessage?: (message: any) => void
) {
  useRealtimeEvent('outreach.message.received', (event) => {
    // Show notification
    toast.info(`New message from ${event.data.influencer_name}`);
    
    // Callback
    onNewMessage?.(event.data);
  });
}

// src/hooks/realtime/useCampaignUpdates.ts

import { useChannel } from '@/context/RealtimeContext';

/**
 * Subscribe to campaign-specific updates
 */
export function useCampaignUpdates(
  campaignId: string,
  onStatusChange?: (status: string) => void
) {
  useChannel(
    `campaign:${campaignId}`,
    'campaign.status.changed',
    (event) => {
      onStatusChange?.(event.data.new_status);
    }
  );
}

// src/hooks/realtime/useTeamPresence.ts

import { useState, useEffect } from 'react';
import { useRealtimeEvent, useRealtime } from '@/context/RealtimeContext';

/**
 * Track online team members
 */
export function useTeamPresence() {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  
  useRealtimeEvent('team.presence.updated', (event) => {
    const { user_id, status } = event.data;
    
    setOnlineUsers(prev => {
      if (status === 'online') {
        return [...new Set([...prev, user_id])];
      } else {
        return prev.filter(id => id !== user_id);
      }
    });
  });
  
  return onlineUsers;
}
```

---

## 7. Summary

### Event Categories Count

| Category | Event Types | Use Cases |
|----------|-------------|-----------|
| Billing | 6 | Quota, subscription, payments |
| Campaign | 4 | Status, deadlines, budget |
| Outreach | 4 | Messages, responses, bulk |
| Influencer | 3 | Collaboration, content |
| Team | 4 | Comments, mentions, tasks, presence |
| Discovery | 2 | Search, shortlist |
| AI Agents | 4 | Tasks, approvals |
| Analytics | 3 | Reports, alerts |
| Approvals | 3 | Workflow states |
| Integrations | 4 | Social connections |
| System | 3 | Maintenance, security |
| **TOTAL** | **~40+** | **12 categories** |

### Architecture Benefits

1. **Generic** - Same infrastructure for all features
2. **Scalable** - Redis-ready for multi-server
3. **Type-safe** - Event registry with schemas
4. **Easy to use** - Simple publish API
5. **Extensible** - Add events without code changes
