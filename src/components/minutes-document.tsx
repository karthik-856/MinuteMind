import { Button } from "@/components/ui/button";
import { minutesToMarkdown } from "@/lib/agents/pipeline";
import { formatLongDate } from "@/lib/dates";
import type { Meeting, Task } from "@/lib/types";
import { DownloadIcon } from "lucide-react";
import { toast } from "sonner";

export function MinutesDocument({
  meeting,
  tasks,
  onTaskClick,
}: {
  meeting: Meeting;
  tasks: Task[];
  onTaskClick?: (taskId: string) => void;
}) {
  const minutes = meeting.minutes;

  function download() {
    const markdown = minutesToMarkdown(meeting, tasks);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${meeting.title.replace(/[^\w]+/g, "-").toLowerCase()}-minutes.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Minutes downloaded as Markdown.");
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-brass/20 bg-card shadow-[0_22px_56px_oklch(0.28_0.03_240/0.09)]">
      <div className="flex flex-col gap-4 border-b border-primary/15 bg-paper px-6 py-7 sm:flex-row sm:items-start sm:justify-between sm:px-10">
        <div>
          <p className="kicker">Minutes of meeting</p>
          <h2 className="font-heading mt-1.5 text-2xl leading-tight text-balance sm:text-[1.85rem]">
            {meeting.title}
          </h2>
          <div className="ink-rule" />
          <p className="mt-2 text-sm text-muted-foreground">
            {formatLongDate(meeting.date)} · {meeting.durationMinutes} min ·{" "}
            {meeting.attendees.length} attendees
          </p>
          <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
            Action items below open the originating sentence and the linked task. This record
            is the source of truth for the meeting.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={download}>
          <DownloadIcon data-icon="inline-start" />
          Markdown
        </Button>
      </div>

      <div className="space-y-8 px-6 py-6 sm:px-8">
        <section>
          <h3 className="kicker">1. Executive summary</h3>
          <p className="mt-2 max-w-3xl text-[15px] leading-7">
            {minutes?.executiveSummary ?? "Minutes have not been generated yet."}
          </p>
        </section>

        <section>
          <h3 className="kicker">2. Attendees</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {meeting.attendees.length ? (
              meeting.attendees.map((person) => (
                <li
                  key={person.name}
                  className="rounded-full border bg-muted/60 px-3 py-1 text-sm"
                >
                  {person.name}
                  {person.role ? (
                    <span className="text-muted-foreground"> · {person.role}</span>
                  ) : null}
                </li>
              ))
            ) : (
              <li className="text-sm text-muted-foreground">No speakers detected.</li>
            )}
          </ul>
        </section>

        <section>
          <h3 className="kicker">3. Agenda</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-[15px] leading-7">
            {(minutes?.agenda ?? []).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>

        <section>
          <h3 className="kicker">4. Discussion</h3>
          <div className="mt-3 space-y-4">
            {(minutes?.discussion ?? []).map((item) => (
              <div key={item.topic} className="rounded-xl border border-border/70 bg-paper p-4">
                <p className="font-medium">{item.topic}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {item.summary}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Speakers: {item.speakers.join(", ")}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="kicker">5. Decisions</h3>
          {minutes?.decisions.length ? (
            <ul className="mt-3 space-y-2">
              {minutes.decisions.map((item) => (
                <li key={item.id} className="rounded-lg border-l-2 border-primary bg-card px-4 py-3">
                  <p className="text-[15px] leading-6">{item.text}</p>
                  {item.decidedBy ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Recorded from {item.decidedBy}
                    </p>
                  ) : null}
                  {item.quote ? (
                    <p className="mt-2 text-xs text-muted-foreground">Source: “{item.quote}”</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No explicit decisions found.</p>
          )}
        </section>

        <section>
          <h3 className="kicker">6. Action items</h3>
          {tasks.length ? (
            <div className="mt-3">
              <table className="w-full table-fixed text-left text-sm">
                <thead className="text-xs tracking-wide text-muted-foreground uppercase">
                  <tr className="border-b">
                    <th className="w-[42%] py-2 pr-3 font-medium">Task</th>
                    <th className="w-[22%] py-2 pr-3 font-medium">Owner</th>
                    <th className="w-[18%] py-2 pr-3 font-medium">Due</th>
                    <th className="w-[18%] py-2 font-medium">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} className="border-b last:border-0">
                      <td className="py-2.5 pr-3 align-top break-words">
                        {onTaskClick ? (
                          <button
                            type="button"
                            className="text-left text-primary hover:underline"
                            onClick={() => onTaskClick(task.id)}
                          >
                            {task.title}
                          </button>
                        ) : (
                          task.title
                        )}
                      </td>
                      <td className="py-2.5 pr-3 align-top break-words">
                        {task.owner || "Unassigned"}
                      </td>
                      <td className="py-2.5 pr-3 align-top break-words">{task.dueDate ?? "—"}</td>
                      <td className="py-2.5 align-top capitalize">{task.priority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No action items extracted.</p>
          )}
        </section>

        <section>
          <h3 className="kicker">7. Risks and open questions</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
            {(minutes?.risks ?? []).map((item) => (
              <li key={item}>{item}</li>
            ))}
            {(minutes?.openQuestions ?? []).map((item) => (
              <li key={item}>{item}</li>
            ))}
            {!minutes?.risks.length && !minutes?.openQuestions.length ? (
              <li className="list-none text-muted-foreground">None recorded.</li>
            ) : null}
          </ul>
        </section>
      </div>
    </article>
  );
}
