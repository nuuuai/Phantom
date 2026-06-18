export interface BreachTimelinePoint {
  findingId: string;
  detectedAt: string;
  estimatedExposedAt: string;
  lagDays: number;
}
