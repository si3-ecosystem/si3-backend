# RSVP System Frontend Implementation Guide

## Overview
This guide outlines the complete frontend implementation for the SI3 RSVP system using Next.js, TypeScript, and atomic design principles.

## Architecture Decisions

### Data Flow Strategy
- **Event Data Source**: Fetch directly from Sanity CMS (single source of truth)
- **RSVP Data**: Store in MongoDB, reference events by Sanity document ID
- **Real-time Updates**: Use SWR for data fetching and caching
- **State Management**: React Context API for global RSVP state

### Component Architecture
Following atomic design principles with TypeScript interfaces:

```
components/
├── atoms/
│   ├── Button/
│   ├── Input/
│   ├── Badge/
│   └── LoadingSpinner/
├── molecules/
│   ├── RSVPStatusCard/
│   ├── AttendeeCounter/
│   ├── EventCapacityBar/
│   └── RSVPForm/
├── organisms/
│   ├── RSVPWidget/
│   ├── AttendeeList/
│   ├── RSVPDashboard/
│   └── EventRSVPManager/
└── templates/
    ├── EventDetailPage/
    ├── RSVPManagementPage/
    └── AdminDashboardPage/
```

## Core Types & Interfaces

### RSVP Types
```typescript
// types/rsvp.ts
export enum RSVPStatus {
  ATTENDING = 'attending',
  NOT_ATTENDING = 'not_attending',
  MAYBE = 'maybe',
  WAITLISTED = 'waitlisted'
}

export interface ContactInfo {
  phone?: string;
  emergencyContact?: string;
}

export interface RSVP {
  _id: string;
  eventId: string;
  userId: string;
  status: RSVPStatus;
  guestCount: number;
  dietaryRestrictions?: string;
  specialRequests?: string;
  contactInfo?: ContactInfo;
  waitlistPosition?: number;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RSVPStats {
  totalRSVPs: number;
  attending: number;
  notAttending: number;
  maybe: number;
  waitlisted: number;
  totalGuests: number;
  availableSpots: number;
  isAtCapacity: boolean;
}

export interface EventRSVPData {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  maxCapacity?: number;
  waitlistEnabled: boolean;
  rsvpDeadline?: string;
  stats: RSVPStats;
  userRSVP?: RSVP;
}
```

### Event Types (Sanity Integration)
```typescript
// types/event.ts
export interface SanityEvent {
  _id: string;
  title: string;
  description: string;
  eventDate: string;
  endDate?: string;
  location: {
    venue: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  rsvpSettings: {
    enabled: boolean;
    maxCapacity?: number;
    waitlistEnabled: boolean;
    rsvpDeadline?: string;
    requiresApproval: boolean;
    allowGuests: boolean;
    maxGuestsPerRSVP: number;
  };
  organizer: {
    name: string;
    email: string;
  };
  tags: string[];
  slug: string;
}
```

## API Integration Layer

### RSVP Service
```typescript
// services/rsvpService.ts
import { RSVP, RSVPStats, EventRSVPData } from '@/types/rsvp';

class RSVPService {
  private baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  async createRSVP(data: Partial<RSVP>): Promise<RSVP> {
    const response = await fetch(`${this.baseURL}/api/rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create RSVP');
    }
    
    const result = await response.json();
    return result.data;
  }

  async updateRSVP(rsvpId: string, data: Partial<RSVP>): Promise<RSVP> {
    const response = await fetch(`${this.baseURL}/api/rsvp/${rsvpId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update RSVP');
    }
    
    const result = await response.json();
    return result.data;
  }

  async getEventRSVPData(eventId: string): Promise<EventRSVPData> {
    const response = await fetch(`${this.baseURL}/api/rsvp/event/${eventId}/stats`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch event RSVP data');
    }
    
    const result = await response.json();
    return result.data;
  }

  async getUserRSVPs(params?: { page?: number; limit?: number; status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const response = await fetch(`${this.baseURL}/api/rsvp/my-rsvps?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user RSVPs');
    }
    
    const result = await response.json();
    return result.data;
  }

  async downloadCalendarInvite(rsvpId: string): Promise<Blob> {
    const response = await fetch(`${this.baseURL}/api/rsvp/${rsvpId}/calendar`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to download calendar invite');
    }
    
    return response.blob();
  }

  private getAuthToken(): string {
    // Implement your auth token retrieval logic
    return localStorage.getItem('authToken') || '';
  }
}

export const rsvpService = new RSVPService();
```

## Core Components

### Atoms

#### RSVPStatusBadge
```typescript
// components/atoms/RSVPStatusBadge/RSVPStatusBadge.tsx
import { RSVPStatus } from '@/types/rsvp';

interface RSVPStatusBadgeProps {
  status: RSVPStatus;
  className?: string;
}

const statusConfig = {
  [RSVPStatus.ATTENDING]: {
    label: 'Attending',
    className: 'bg-green-100 text-green-800 border-green-200'
  },
  [RSVPStatus.NOT_ATTENDING]: {
    label: 'Not Attending',
    className: 'bg-red-100 text-red-800 border-red-200'
  },
  [RSVPStatus.MAYBE]: {
    label: 'Maybe',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  [RSVPStatus.WAITLISTED]: {
    label: 'Waitlisted',
    className: 'bg-blue-100 text-blue-800 border-blue-200'
  }
};

export const RSVPStatusBadge: React.FC<RSVPStatusBadgeProps> = ({ 
  status, 
  className = '' 
}) => {
  const config = statusConfig[status];
  
  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
      ${config.className} ${className}
    `}>
      {config.label}
    </span>
  );
};
```

#### CapacityProgressBar
```typescript
// components/atoms/CapacityProgressBar/CapacityProgressBar.tsx
interface CapacityProgressBarProps {
  current: number;
  maximum?: number;
  className?: string;
}

export const CapacityProgressBar: React.FC<CapacityProgressBarProps> = ({
  current,
  maximum,
  className = ''
}) => {
  if (!maximum) {
    return (
      <div className={`text-sm text-gray-600 ${className}`}>
        {current} attending
      </div>
    );
  }

  const percentage = Math.min((current / maximum) * 100, 100);
  const isNearCapacity = percentage >= 90;
  const isAtCapacity = percentage >= 100;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">
          {current} of {maximum} spots filled
        </span>
        <span className={`font-medium ${
          isAtCapacity ? 'text-red-600' : 
          isNearCapacity ? 'text-yellow-600' : 
          'text-green-600'
        }`}>
          {percentage.toFixed(0)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            isAtCapacity ? 'bg-red-500' :
            isNearCapacity ? 'bg-yellow-500' :
            'bg-green-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isAtCapacity && (
        <p className="text-xs text-red-600 font-medium">
          Event is at full capacity
        </p>
      )}
    </div>
  );
};
```

### Molecules

#### RSVPForm
```typescript
// components/molecules/RSVPForm/RSVPForm.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RSVPStatus, RSVP } from '@/types/rsvp';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { TextArea } from '@/components/atoms/TextArea';
import { Select } from '@/components/atoms/Select';

const rsvpFormSchema = z.object({
  status: z.nativeEnum(RSVPStatus),
  guestCount: z.number().min(1).max(10),
  dietaryRestrictions: z.string().optional(),
  specialRequests: z.string().optional(),
  contactInfo: z.object({
    phone: z.string().optional(),
    emergencyContact: z.string().optional()
  }).optional()
});

type RSVPFormData = z.infer<typeof rsvpFormSchema>;

interface RSVPFormProps {
  eventId: string;
  existingRSVP?: RSVP;
  maxGuestsAllowed: number;
  onSubmit: (data: RSVPFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const RSVPForm: React.FC<RSVPFormProps> = ({
  eventId,
  existingRSVP,
  maxGuestsAllowed,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<RSVPFormData>({
    resolver: zodResolver(rsvpFormSchema),
    defaultValues: {
      status: existingRSVP?.status || RSVPStatus.ATTENDING,
      guestCount: existingRSVP?.guestCount || 1,
      dietaryRestrictions: existingRSVP?.dietaryRestrictions || '',
      specialRequests: existingRSVP?.specialRequests || '',
      contactInfo: {
        phone: existingRSVP?.contactInfo?.phone || '',
        emergencyContact: existingRSVP?.contactInfo?.emergencyContact || ''
      }
    }
  });

  const watchedStatus = watch('status');
  const showGuestFields = watchedStatus === RSVPStatus.ATTENDING;

  const handleFormSubmit = async (data: RSVPFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('RSVP submission failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Response Status *
        </label>
        <Select
          {...register('status')}
          error={errors.status?.message}
          disabled={isLoading || isSubmitting}
        >
          <option value={RSVPStatus.ATTENDING}>Yes, I'll attend</option>
          <option value={RSVPStatus.MAYBE}>Maybe</option>
          <option value={RSVPStatus.NOT_ATTENDING}>Can't attend</option>
        </Select>
      </div>

      {showGuestFields && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Guests (including yourself) *
            </label>
            <Input
              type="number"
              min="1"
              max={maxGuestsAllowed}
              {...register('guestCount', { valueAsNumber: true })}
              error={errors.guestCount?.message}
              disabled={isLoading || isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dietary Restrictions
            </label>
            <Input
              type="text"
              placeholder="e.g., Vegetarian, Gluten-free, Allergies"
              {...register('dietaryRestrictions')}
              error={errors.dietaryRestrictions?.message}
              disabled={isLoading || isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Requests
            </label>
            <TextArea
              placeholder="Any special accommodations needed?"
              rows={3}
              {...register('specialRequests')}
              error={errors.specialRequests?.message}
              disabled={isLoading || isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="+1 (555) 123-4567"
                {...register('contactInfo.phone')}
                error={errors.contactInfo?.phone?.message}
                disabled={isLoading || isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact
              </label>
              <Input
                type="text"
                placeholder="Name - Phone"
                {...register('contactInfo.emergencyContact')}
                error={errors.contactInfo?.emergencyContact?.message}
                disabled={isLoading || isSubmitting}
              />
            </div>
          </div>
        </>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading || isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'Saving...' : existingRSVP ? 'Update RSVP' : 'Submit RSVP'}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading || isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};
```

### Organisms

#### RSVPWidget
```typescript
// components/organisms/RSVPWidget/RSVPWidget.tsx
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { SanityEvent } from '@/types/event';
import { EventRSVPData, RSVPStatus } from '@/types/rsvp';
import { rsvpService } from '@/services/rsvpService';
import { RSVPForm } from '@/components/molecules/RSVPForm';
import { EventCapacityCard } from '@/components/molecules/EventCapacityCard';
import { RSVPStatusBadge } from '@/components/atoms/RSVPStatusBadge';
import { Button } from '@/components/atoms/Button';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';

interface RSVPWidgetProps {
  event: SanityEvent;
  className?: string;
}

export const RSVPWidget: React.FC<RSVPWidgetProps> = ({ event, className = '' }) => {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: rsvpData, error, mutate } = useSWR<EventRSVPData>(
    `/api/rsvp/event/${event._id}/stats`,
    () => rsvpService.getEventRSVPData(event._id),
    { refreshInterval: 30000 } // Refresh every 30 seconds
  );

  const isRSVPOpen = event.rsvpSettings.enabled &&
    (!event.rsvpSettings.rsvpDeadline || new Date(event.rsvpSettings.rsvpDeadline) > new Date());

  const handleRSVPSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      if (rsvpData?.userRSVP) {
        await rsvpService.updateRSVP(rsvpData.userRSVP._id, formData);
      } else {
        await rsvpService.createRSVP({
          eventId: event._id,
          ...formData
        });
      }
      await mutate(); // Refresh data
      setShowForm(false);
    } catch (error) {
      console.error('RSVP submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadCalendar = async () => {
    if (!rsvpData?.userRSVP) return;

    try {
      const blob = await rsvpService.downloadCalendarInvite(rsvpData.userRSVP._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Calendar download failed:', error);
    }
  };

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <p className="text-red-600">Failed to load RSVP information</p>
      </div>
    );
  }

  if (!rsvpData) {
    return (
      <div className={`flex justify-center p-8 ${className}`}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current RSVP Status */}
      {rsvpData.userRSVP && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Your RSVP Status</p>
              <div className="flex items-center gap-2 mt-1">
                <RSVPStatusBadge status={rsvpData.userRSVP.status} />
                {rsvpData.userRSVP.guestCount > 1 && (
                  <span className="text-sm text-gray-600">
                    ({rsvpData.userRSVP.guestCount} guests)
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {rsvpData.userRSVP.status === RSVPStatus.ATTENDING && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadCalendar}
                >
                  Add to Calendar
                </Button>
              )}
              {isRSVPOpen && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(true)}
                >
                  Update RSVP
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Event Capacity */}
      <EventCapacityCard
        stats={rsvpData.stats}
        maxCapacity={event.rsvpSettings.maxCapacity}
        waitlistEnabled={event.rsvpSettings.waitlistEnabled}
      />

      {/* RSVP Form or CTA */}
      {showForm ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            {rsvpData.userRSVP ? 'Update Your RSVP' : 'RSVP for This Event'}
          </h3>
          <RSVPForm
            eventId={event._id}
            existingRSVP={rsvpData.userRSVP}
            maxGuestsAllowed={event.rsvpSettings.maxGuestsPerRSVP}
            onSubmit={handleRSVPSubmit}
            onCancel={() => setShowForm(false)}
            isLoading={isSubmitting}
          />
        </div>
      ) : (
        !rsvpData.userRSVP && isRSVPOpen && (
          <div className="text-center">
            {rsvpData.stats.isAtCapacity && event.rsvpSettings.waitlistEnabled ? (
              <Button
                variant="secondary"
                onClick={() => setShowForm(true)}
                className="w-full"
              >
                Join Waitlist
              </Button>
            ) : !rsvpData.stats.isAtCapacity ? (
              <Button
                variant="primary"
                onClick={() => setShowForm(true)}
                className="w-full"
              >
                RSVP Now
              </Button>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-600">This event is at full capacity</p>
              </div>
            )}
          </div>
        )
      )}

      {!isRSVPOpen && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            RSVP is currently closed for this event
          </p>
        </div>
      )}
    </div>
  );
};
```

## Hooks & Context

### RSVP Context
```typescript
// contexts/RSVPContext.tsx
import { createContext, useContext, useReducer, ReactNode } from 'react';
import { RSVP, EventRSVPData } from '@/types/rsvp';

interface RSVPState {
  userRSVPs: RSVP[];
  eventRSVPData: Record<string, EventRSVPData>;
  isLoading: boolean;
  error: string | null;
}

type RSVPAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER_RSVPS'; payload: RSVP[] }
  | { type: 'ADD_RSVP'; payload: RSVP }
  | { type: 'UPDATE_RSVP'; payload: RSVP }
  | { type: 'REMOVE_RSVP'; payload: string }
  | { type: 'SET_EVENT_RSVP_DATA'; payload: { eventId: string; data: EventRSVPData } };

const initialState: RSVPState = {
  userRSVPs: [],
  eventRSVPData: {},
  isLoading: false,
  error: null
};

const rsvpReducer = (state: RSVPState, action: RSVPAction): RSVPState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_USER_RSVPS':
      return { ...state, userRSVPs: action.payload };
    case 'ADD_RSVP':
      return { ...state, userRSVPs: [...state.userRSVPs, action.payload] };
    case 'UPDATE_RSVP':
      return {
        ...state,
        userRSVPs: state.userRSVPs.map(rsvp =>
          rsvp._id === action.payload._id ? action.payload : rsvp
        )
      };
    case 'REMOVE_RSVP':
      return {
        ...state,
        userRSVPs: state.userRSVPs.filter(rsvp => rsvp._id !== action.payload)
      };
    case 'SET_EVENT_RSVP_DATA':
      return {
        ...state,
        eventRSVPData: {
          ...state.eventRSVPData,
          [action.payload.eventId]: action.payload.data
        }
      };
    default:
      return state;
  }
};

const RSVPContext = createContext<{
  state: RSVPState;
  dispatch: React.Dispatch<RSVPAction>;
} | null>(null);

export const RSVPProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(rsvpReducer, initialState);

  return (
    <RSVPContext.Provider value={{ state, dispatch }}>
      {children}
    </RSVPContext.Provider>
  );
};

export const useRSVP = () => {
  const context = useContext(RSVPContext);
  if (!context) {
    throw new Error('useRSVP must be used within an RSVPProvider');
  }
  return context;
};
```

## Page Templates

### Event Detail Page
```typescript
// pages/events/[slug].tsx
import { GetStaticProps, GetStaticPaths } from 'next';
import { SanityEvent } from '@/types/event';
import { RSVPWidget } from '@/components/organisms/RSVPWidget';
import { sanityClient } from '@/lib/sanity';

interface EventDetailPageProps {
  event: SanityEvent;
}

const EventDetailPage: React.FC<EventDetailPageProps> = ({ event }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Event Details */}
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {event.title}
          </h1>

          <div className="prose max-w-none mb-8">
            <p className="text-lg text-gray-600">{event.description}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Event Details</h2>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">Date & Time:</span>
                <p className="text-gray-600">
                  {new Date(event.eventDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Location:</span>
                <p className="text-gray-600">
                  {event.location.venue}<br />
                  {event.location.address}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Organizer:</span>
                <p className="text-gray-600">{event.organizer.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* RSVP Widget */}
        <div className="lg:col-span-1">
          {event.rsvpSettings.enabled && (
            <RSVPWidget event={event} />
          )}
        </div>
      </div>
    </div>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const events = await sanityClient.fetch(`
    *[_type == "event" && defined(slug.current)] {
      "slug": slug.current
    }
  `);

  const paths = events.map((event: { slug: string }) => ({
    params: { slug: event.slug }
  }));

  return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const event = await sanityClient.fetch(`
    *[_type == "event" && slug.current == $slug][0] {
      _id,
      title,
      description,
      eventDate,
      endDate,
      location,
      rsvpSettings,
      organizer,
      tags,
      "slug": slug.current
    }
  `, { slug: params?.slug });

  if (!event) {
    return { notFound: true };
  }

  return {
    props: { event },
    revalidate: 60 // Revalidate every minute
  };
};

export default EventDetailPage;
```

## Implementation Checklist

### Phase 1: Core Setup
- [ ] Install required dependencies (react-hook-form, zod, swr, date-fns)
- [ ] Set up TypeScript interfaces and types
- [ ] Create API service layer
- [ ] Implement basic atoms (Button, Input, Badge, etc.)

### Phase 2: RSVP Components
- [ ] Build RSVPForm molecule
- [ ] Create EventCapacityCard molecule
- [ ] Implement RSVPWidget organism
- [ ] Add calendar download functionality

### Phase 3: Integration
- [ ] Set up RSVP context and state management
- [ ] Integrate with Sanity for event data
- [ ] Connect to backend RSVP API
- [ ] Implement real-time updates with SWR

### Phase 4: Advanced Features
- [ ] Add waitlist functionality
- [ ] Implement admin dashboard
- [ ] Create email notification triggers
- [ ] Add analytics and reporting

### Phase 5: Testing & Optimization
- [ ] Write unit tests for components
- [ ] Add integration tests for RSVP flow
- [ ] Implement error boundaries
- [ ] Optimize performance and caching

## Dependencies

```json
{
  "dependencies": {
    "@hookform/resolvers": "^3.3.2",
    "date-fns": "^2.30.0",
    "react-hook-form": "^7.48.2",
    "swr": "^2.2.4",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^6.1.4",
    "@types/react": "^18.2.37"
  }
}
```
