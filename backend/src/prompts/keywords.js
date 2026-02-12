/**
 * Prompt template for extracting keywords from text
 * Focuses on extracting skills, talents, and relevant experience
 * @param {string} text - The text to extract keywords from
 * @returns {string} The formatted prompt
 */
export function extractKeywordsPrompt(text) {
  return `Extract 5-10 skills, talents, and relevant experience keywords from the following biography text.

IMPORTANT: Return ONLY a comma-separated list of keywords. Do not number them, do not add explanations, do not format them as a list.

Focus on:
- Technical skills (programming languages, frameworks, tools)
- Soft skills (leadership, communication, problem-solving)
- Domain expertise (industries, methodologies, specializations)
- Certifications or notable achievements
- Specific technologies or platforms

Do NOT extract:
- Generic descriptors (professional, experienced, passionate)
- Job titles or roles (unless they represent a skill domain)
- Company names (unless they represent industry expertise)
- Locations or dates

Examples:

Text: "Sarah is a data scientist with expertise in Python and machine learning. She has built predictive models using TensorFlow and scikit-learn, and leads workshops on statistical analysis."
Keywords: Python, Machine Learning, TensorFlow, scikit-learn, Predictive Modeling, Statistical Analysis, Data Science, Workshop Facilitation

Text: "James is a creative director specializing in brand identity and digital design. He's proficient in Adobe Creative Suite and has a strong background in user experience design and visual storytelling."
Keywords: Brand Identity, Digital Design, Adobe Creative Suite, User Experience Design, Visual Storytelling, Creative Direction

Text: "Maria has 15 years of experience in project management, leading cross-functional teams in agile environments. She's certified in PMP and Scrum Master, with expertise in stakeholder management and strategic planning."
Keywords: Project Management, Agile Methodologies, PMP, Scrum Master, Cross-functional Leadership, Stakeholder Management, Strategic Planning

Now extract keywords from this text:

${text}

Keywords:`;
}
