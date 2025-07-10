import OpenAI from "openai";
import dotenv from "dotenv";


dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const tailorResume = async (req, res) => {
const { analysis, currentResumeText } = req.body;

  if (!analysis || !currentResumeText ) {
    return res.status(400).json({
      error: "analysis, currentResumeText, JobDescription, and Requirements are required."
    });
  }

  try {
    const prompt = `
You are a professional resume writer.

Here is a summary of feedback about a candidate's resume:
${analysis}

Here is the original Resume:
${currentResumeText}

Using only this feedback, write a new and improved resume that:
- Fixes any weak sections
- Adds missing skills or achievements
- Rephrases unclear or redundant parts

Do not chnage anything esle in the resume only add the missing skills to the original resumes skill section

Deliver a polished and realistic resume based on what the candidate might have meant.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You rewrite resumes to fit jobs realistically." },
        { role: "user", content: prompt }
      ],
      max_tokens: 1000,
    });

    const tailoredResume = response.choices[0].message.content;
    console.log(tailoredResume);

    return res.json({
      success: true,
      tailoredResume,
    });

  } catch (error) {
    console.error("Error generating tailored resume:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate tailored resume.",
      error: error.message || error,
    });
  }
};

export const generateCoverLetter = async (req, res) => {
  const {skills, experience, JobDescription, Requirements} = req.body;

  try {
    const prompt = `You are a skilled writer helping a job seeker create a natural, informal, and conversational cover letter.
    Use the applicant's skills and experience to craft a unique letter that connects personally with the job's description and requirements.
    Make it sound like it was written by a real person, not an AI — relaxed, confident, and sincere. It should feel like a thoughtful message, not a corporate template.
    Tone and Style Guidelines:
    Write like a real human would talk — friendly and personal, not robotic
    Use natural transitions and everyday language Show personality and interest in the role or company
    Vary sentence length and rhythm for a natural feel Avoid buzzwords, clichés, or overly formal language
    Keep it concise (3-4 paragraphs). End with a simple, honest sign-off — nothing over-the-top.

    Skills:
    ${skills}

    Experience:
    ${experience}

    Job Description:
    ${JobDescription}

    Job Requirements:
    ${Requirements}
    Now, write the cover letter using this info. No asterisks, markdown, or extra explanation — just the letter.`

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You create Human written cover letters" },
        { role: "user", content: prompt }
      ],
      max_tokens: 1000,
    });

    const coverLetter = response.choices[0].message.content;
    console.log(coverLetter);

    return res.json({
      success: true,
      coverLetter,
    });


  }catch(error){
    console.error("Error generating cover letter:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate cover letter.",
      error: error.message || error,
    });
  }
}
