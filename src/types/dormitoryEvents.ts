export type DormitoryEvent = {
  date: string;
  grade: number | null;
  name: string;
};

export type DormitoryEventsPayload = {
  academic_year: number;
  events: DormitoryEvent[];
};
