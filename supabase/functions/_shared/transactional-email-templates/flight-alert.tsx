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
