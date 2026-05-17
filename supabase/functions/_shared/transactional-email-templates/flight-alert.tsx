/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface FlightAlertProps {
  subject?: string
  message?: string
}

const FlightAlertEmail = ({ subject, message }: FlightAlertProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{subject ?? 'Flight Tracker alert'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{subject ?? 'Flight Tracker alert'}</Heading>
        <Text style={text}>{message ?? 'This is a test alert from your flight tracker.'}</Text>
        <Text style={footer}>— Flight Tracker</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: FlightAlertEmail,
  subject: (data: Record<string, any>) => data?.subject ?? 'Flight Tracker alert',
  displayName: 'Flight alert',
  previewData: { subject: 'Test alert', message: 'This is a test alert from your flight tracker.' },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Inter, Arial, sans-serif',
  margin: '0',
  padding: '0',
}

const container = {
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  margin: '32px auto',
  maxWidth: '560px',
  padding: '32px',
}

const h1 = {
  color: '#111827',
  fontSize: '24px',
  fontWeight: '700',
  lineHeight: '1.25',
  margin: '0 0 16px',
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 24px',
}

const footer = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '28px 0 0',
}
