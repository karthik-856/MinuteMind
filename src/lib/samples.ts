export interface SampleMeeting {
  id: string;
  title: string;
  durationMinutes: number;
  daysAgo: number;
  blurb: string;
  transcript: string;
}

export const SAMPLE_MEETINGS: SampleMeeting[] = [
  {
    id: "sample-fyp",
    title: "FYP Review — MinuteMind Sprint 6",
    durationMinutes: 42,
    daysAgo: 4,
    blurb: "Advisor review of the meeting-intelligence prototype, evaluation plan, and demo script.",
    transcript: `Dr. Kavitha Iyer (Advisor): Welcome to the Sprint 6 review of MinuteMind. Today we need a clear demo path for the mid-term evaluation.
Ananya Shah (Student): I will finish the minutes layout by Friday so the document looks like a real MoM, not a chat dump.
Rohan Gupta (Student): The action extractor still misses owners when people say first names only. I can tighten the name matcher this week.
Dr. Kavitha Iyer (Advisor): We decided the evaluation will use three recorded lab meetings plus two public transcripts. That is the dataset lock.
Ananya Shah (Student): Open question — do we need IRB-style consent if we use our own team recordings?
Dr. Kavitha Iyer (Advisor): Yes. Please draft a one-page consent note by Wednesday. I will review it.
Rohan Gupta (Student): There is a blocker on the follow-up scheduler. Relative dates like next Friday are still slipping to the wrong week.
Ananya Shah (Student): I am going to add a golden test set of twenty utterances tonight so we can catch that.
Dr. Kavitha Iyer (Advisor): Let's go with a live agent trace in the UI. Evaluators should see each specialist agent hand off work.
Rohan Gupta (Student): I will record a two-minute walkthrough by Monday and share it on the project drive.
Ananya Shah (Student): Can you also update the architecture diagram, Rohan? The old one still shows a single LLM call.
Rohan Gupta (Student): Sure, I will update the diagram tomorrow.
Dr. Kavitha Iyer (Advisor): Concern: the mid-term slot might slip if the demo is not stable. High priority on a canned sample that always works even without an API key.
Ananya Shah (Student): Agreed. We will ship the local pipeline as the default engine. Moving on to grading rubrics.
Dr. Kavitha Iyer (Advisor): Rubric should cover minutes quality, task extraction F1, and follow-up usefulness. I will send last year's rubric on Thursday.
Rohan Gupta (Student): What about latency? Do we need to report agent runtime?
Dr. Kavitha Iyer (Advisor): Yes, include it in the report appendix. Final decision: freeze the agent list at six specialists, no extra agents before evaluation.`,
  },
  {
    id: "sample-placement",
    title: "Placement Cell × Nimbus Labs Kickoff",
    durationMinutes: 38,
    daysAgo: 7,
    blurb: "Campus recruitment kickoff covering roles, eligibility, and the briefing schedule.",
    transcript: `[10:02] Meera Nair (Placement Officer): Welcome to the Nimbus Labs kickoff. Today we lock the hiring plan for the 2027 batch.
[10:03] Kabir Sen (Recruiter): We are hiring six intern-plus-PPO roles in platform engineering and two in applied ML.
[10:04] Meera Nair (Placement Officer): Eligibility is 7.5 CGPA and no active backlogs. We decided to keep the CGPA cutoff at 7.5.
[10:06] Aisha Rahman (Student Coordinator): I will publish the registration form by tomorrow and pin it on the official channel.
[10:07] Kabir Sen (Recruiter): Please share last year's shortlist stats, Meera. I need them before Friday.
[10:08] Meera Nair (Placement Officer): I will send the stats this afternoon.
[10:10] Aisha Rahman (Student Coordinator): Concern: the lab slots clash with the GATE mock on the 12th. We might slip the briefing.
[10:11] Kabir Sen (Recruiter): Let's go with Thursday evening for the briefing instead. Final call.
[10:13] Aisha Rahman (Student Coordinator): I can book LH-3 for Thursday and send a calendar invite tonight.
[10:14] Meera Nair (Placement Officer): Open question — can students with a 7.4 CGPA petition? We need a written policy.
[10:15] Kabir Sen (Recruiter): No petitions this cycle. I will send a one-paragraph eligibility note today.
[10:17] Aisha Rahman (Student Coordinator): I will prepare a FAQ for the WhatsApp group by Wednesday.
[10:18] Meera Nair (Placement Officer): Moving on to the assignment. Kabir, can you share the take-home by next week?
[10:19] Kabir Sen (Recruiter): Yes, I will share the take-home on Monday. Please do not circulate it before the briefing.
[10:21] Aisha Rahman (Student Coordinator): There is a dependency on the audio setup in LH-3. I am waiting on the AV team.
[10:22] Meera Nair (Placement Officer): Flag that as a blocker. I will escalate to facilities if we do not hear back tomorrow.
[10:24] Kabir Sen (Recruiter): We agreed the first shortlist goes out ten days after the briefing. I will own that date.
[10:26] Meera Nair (Placement Officer): Thank you. Minutes and tasks should go to both offices after this call.`,
  },
  {
    id: "sample-ethics",
    title: "Department Research Ethics Check-in",
    durationMinutes: 35,
    daysAgo: 14,
    blurb: "Ethics review of interview recordings, consent, and dataset retention for a student project.",
    transcript: `Prof. Helen D'Souza (Chair): This is the ethics check-in for student interview recordings. We need a retention decision today.
Nikhil Bose (Researcher): I will anonymise the transcripts before they leave the lab laptop. Names will be replaced with P1, P2.
Prof. Helen D'Souza (Chair): We decided recordings are stored for twelve months, then deleted. That is the policy.
Leah Fernandes (Lab Manager): I can set a calendar reminder for deletion at the end of the month after the project fair.
Nikhil Bose (Researcher): Concern: two participants still have not returned the consent form. We might have to drop those sessions.
Prof. Helen D'Souza (Chair): Please follow up with them by Tuesday. If there is no form, do not use the audio.
Leah Fernandes (Lab Manager): I will send the reminder emails this afternoon and copy the chair.
Nikhil Bose (Researcher): Open question — can we keep derived minutes after the audio is deleted?
Prof. Helen D'Souza (Chair): Yes. Minutes and coded notes may be retained. Audio may not. Let's lock that in.
Leah Fernandes (Lab Manager): I will update the data-management plan tomorrow and put it on the shared drive.
Nikhil Bose (Researcher): I am going to strip timestamps that could identify a class timetable.
Prof. Helen D'Souza (Chair): Good. Moving on to the external dataset. Do we know if the public corpus allows redistribution?
Nikhil Bose (Researcher): Not yet. I will check the license by Friday and write a short note.
Leah Fernandes (Lab Manager): There is a blocker on the encrypted drive. IT has not issued the keys.
Prof. Helen D'Souza (Chair): I will escalate to IT today. High priority.
Nikhil Bose (Researcher): Thank you. I can pause new recordings until the drive is ready.
Prof. Helen D'Souza (Chair): Approved. No new recordings until storage is in place. Final decision.`,
  },
  {
    id: "sample-sprint",
    title: "Campus Nav App — Sprint Planning",
    durationMinutes: 40,
    daysAgo: 0,
    blurb: "Use this unprocessed transcript to watch the six agents run live.",
    transcript: `Tara Menon (PM): Welcome to sprint planning for the campus navigation app. Today we pick the demo scope for the open day.
Dev Patel (Engineering): I will finish indoor Bluetooth ranging by Thursday so the library floor plan actually works.
Sana Kapoor (Design): Please review the accessibility contrast on the map chips, Dev. I can send the Figma link tonight.
Tara Menon (PM): We decided the open-day demo will cover only the academic block and the library. No hostels yet.
Dev Patel (Engineering): There is a blocker on the BLE beacons in the west wing. Facilities has not mounted them.
Tara Menon (PM): I will escalate to facilities tomorrow. If they slip, we fall back to GPS plus QR checkpoints.
Sana Kapoor (Design): I am going to prototype the QR fallback screens by Wednesday.
Riya Bose (QA): Can you add an offline cache test, Dev? The basement still loses signal.
Dev Patel (Engineering): Yes, I will add the offline cache test on Friday.
Tara Menon (PM): Open question — do we show faculty offices? Privacy is a concern.
Sana Kapoor (Design): Let's go with department directories, not named rooms. Final call from me unless legal objects.
Riya Bose (QA): I will write the test cases for directory search by next week.
Tara Menon (PM): Moving on to volunteers. Riya, please schedule a dry run on Monday with two first-year students.
Riya Bose (QA): I can do that. I will send the invite today.
Dev Patel (Engineering): Risk: the ranging accuracy might slip in crowded corridors. We should warn users it is approximate.
Tara Menon (PM): Agreed. Add a confidence label. Sana will design it, Dev will wire it. Ship it this week.
Sana Kapoor (Design): Understood. I will have the confidence badge in Figma tomorrow.`,
  },
];

export function sampleById(id: string): SampleMeeting | undefined {
  return SAMPLE_MEETINGS.find((sample) => sample.id === id);
}
