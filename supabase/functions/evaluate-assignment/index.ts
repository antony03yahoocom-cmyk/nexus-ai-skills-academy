import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Send a private message from the first admin to the student as feedback notification
async function sendFeedbackMessage(
  adminClient: ReturnType<typeof createClient>,
  studentId: string,
  assignmentTitle: string,
  status: string,
  feedback: string
) {
  try {
    const { data: adminRoles } = await adminClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .single();

    if (!adminRoles?.user_id) return; // no admin found, skip silently

    const statusLabel = status === "Approved" ? "✅ Approved" : "❌ Needs Revision";
    const content = `📝 Assignment Update — "${assignmentTitle}"\n\nStatus: ${statusLabel}\n\nFeedback: ${feedback}`;

    await adminClient.from("private_messages").insert({
      sender_id: adminRoles.user_id,
      receiver_id: studentId,
      content,
      is_read: false,
    });
  } catch (_err) {
    // Non-fatal: don't fail the submission if message sending fails
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { submission_id } = await req.json();
    if (!submission_id) {
      return new Response(JSON.stringify({ error: "submission_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: submission, error: subErr } = await adminClient
      .from("submissions")
      .select("*, assignments(*, lessons(*, modules(*, courses(*))))")
      .eq("id", submission_id)
      .single();

    if (subErr || !submission) {
      return new Response(JSON.stringify({ error: "Submission not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const assignment = (submission as any).assignments;
    const course = assignment?.lessons?.modules?.courses;
    const approvalMode = course?.approval_mode || "manual";

    if (approvalMode === "manual") {
      return new Response(JSON.stringify({ status: "Pending", mode: "manual", feedback: "Your submission is under review by an instructor." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (approvalMode === "auto_basic") {
      const feedbackMsg = "Thank you for your submission, your assignment is under review.";
      await adminClient.from("submissions").update({
        status: "Approved",
        feedback: feedbackMsg,
      }).eq("id", submission_id);

      const lessonId = assignment.lesson_id;
      await adminClient.from("lesson_completions").upsert({
        user_id: user.id,
        lesson_id: lessonId,
      }, { onConflict: "user_id,lesson_id" });

      // ✅ Send private message feedback to student
      await sendFeedbackMessage(adminClient, user.id, assignment.title, "Approved", feedbackMsg);

      return new Response(JSON.stringify({ status: "Approved", mode: "auto_basic", feedback: feedbackMsg }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (approvalMode === "auto_smart") {
      const textSubmission = submission.text_submission || "";
      const hasFiles = submission.submission_files && (submission.submission_files as string[]).length > 0;
      const wordCount = textSubmission.trim().split(/\s+/).filter(Boolean).length;

      let validationPassed = true;
      let validationMessage = "";

      if (textSubmission && wordCount < 50) {
        validationPassed = false;
        validationMessage = `Your submission is too short (${wordCount} words). Please write at least 50 words.`;
      }

      if (assignment.deliverable && assignment.deliverable.toLowerCase().includes("file") && !hasFiles) {
        validationPassed = false;
        validationMessage = "This assignment requires a file upload. Please attach your work.";
      }

      if (!textSubmission && !hasFiles) {
        validationPassed = false;
        validationMessage = "Please provide a text submission or upload files.";
      }

      if (!validationPassed) {
        await adminClient.from("submissions").update({
          status: "Rejected",
          feedback: validationMessage,
        }).eq("id", submission_id);

        // ✅ Send rejection feedback as private message
        await sendFeedbackMessage(adminClient, user.id, assignment.title, "Rejected", validationMessage);

        return new Response(JSON.stringify({ status: "Rejected", mode: "auto_smart", feedback: validationMessage, validation_passed: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        const feedbackMsg = "Thank you for your submission, your assignment is under review.";
        await adminClient.from("submissions").update({
          status: "Approved",
          feedback: feedbackMsg,
        }).eq("id", submission_id);

        const lessonId = assignment.lesson_id;
        await adminClient.from("lesson_completions").upsert({
          user_id: user.id,
          lesson_id: lessonId,
        }, { onConflict: "user_id,lesson_id" });

        await sendFeedbackMessage(adminClient, user.id, assignment.title, "Approved", feedbackMsg);

        return new Response(JSON.stringify({ status: "Approved", mode: "auto_smart", feedback: feedbackMsg, validation_passed: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: `You are an assignment evaluator for an online academy. Evaluate the student's submission against the assignment requirements. Return a JSON object with: {"approved": true/false, "feedback": "detailed feedback message"}. Be encouraging but honest. Approve if the student has made a genuine effort and addressed the core requirements.`,
              },
              {
                role: "user",
                content: `Assignment Title: ${assignment.title}\nObjective: ${assignment.objective || "N/A"}\nTask: ${assignment.task || "N/A"}\nDeliverable: ${assignment.deliverable || "N/A"}\nDescription: ${assignment.description || "N/A"}\n\nStudent Submission:\n${textSubmission || "(Files submitted)"}\n\nFiles attached: ${hasFiles ? "Yes" : "No"}`,
              },
            ],
            tools: [{
              type: "function",
              function: {
                name: "evaluate_assignment",
                description: "Evaluate the student assignment submission",
                parameters: {
                  type: "object",
                  properties: {
                    approved: { type: "boolean", description: "Whether the assignment is approved" },
                    feedback: { type: "string", description: "Detailed feedback for the student" },
                  },
                  required: ["approved", "feedback"],
                  additionalProperties: false,
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "evaluate_assignment" } },
          }),
        });

        if (!aiResponse.ok) {
          const feedbackMsg = "Thank you for your submission, your assignment is under review.";
          await adminClient.from("submissions").update({
            status: "Approved",
            feedback: feedbackMsg,
          }).eq("id", submission_id);

          const lessonId = assignment.lesson_id;
          await adminClient.from("lesson_completions").upsert({
            user_id: user.id,
            lesson_id: lessonId,
          }, { onConflict: "user_id,lesson_id" });

          await sendFeedbackMessage(adminClient, user.id, assignment.title, "Approved", feedbackMsg);

          return new Response(JSON.stringify({ status: "Approved", mode: "auto_smart", feedback: feedbackMsg, validation_passed: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        let evaluation = { approved: true, feedback: "Thank you for your submission, your assignment is under review." };

        if (toolCall?.function?.arguments) {
          try {
            evaluation = JSON.parse(toolCall.function.arguments);
          } catch { /* use default */ }
        }

        const finalStatus = evaluation.approved ? "Approved" : "Rejected";
        await adminClient.from("submissions").update({
          status: finalStatus,
          feedback: evaluation.feedback,
        }).eq("id", submission_id);

        if (evaluation.approved) {
          const lessonId = assignment.lesson_id;
          await adminClient.from("lesson_completions").upsert({
            user_id: user.id,
            lesson_id: lessonId,
          }, { onConflict: "user_id,lesson_id" });
        }

        // ✅ Send AI feedback as private message
        await sendFeedbackMessage(adminClient, user.id, assignment.title, finalStatus, evaluation.feedback);

        return new Response(JSON.stringify({ status: finalStatus, mode: "auto_smart", feedback: evaluation.feedback, validation_passed: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (aiErr) {
        console.error("AI evaluation error:", aiErr);
        const feedbackMsg = "Thank you for your submission, your assignment is under review.";
        await adminClient.from("submissions").update({
          status: "Approved",
          feedback: feedbackMsg,
        }).eq("id", submission_id);

        const lessonId = assignment.lesson_id;
        await adminClient.from("lesson_completions").upsert({
          user_id: user.id,
          lesson_id: lessonId,
        }, { onConflict: "user_id,lesson_id" });

        await sendFeedbackMessage(adminClient, user.id, assignment.title, "Approved", feedbackMsg);

        return new Response(JSON.stringify({ status: "Approved", mode: "auto_smart", feedback: feedbackMsg, validation_passed: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ status: "Pending", mode: approvalMode, feedback: "Submission received." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Evaluate assignment error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
