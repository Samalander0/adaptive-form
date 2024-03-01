import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { json } from '@sveltejs/kit';
import { GOOGLE_API_KEY } from '$env/static/private'

const MODEL_NAME = "gemini-pro";
const API_KEY = GOOGLE_API_KEY;

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

const generationConfig = {
  temperature: 0.7,
  topK: 1,
  topP: 1,
  maxOutputTokens: 2048,
};

// Prompt
function prompt(original_question, question_answer, question_option_a, question_option_a_when, question_option_b, question_option_b_when, question_option_c, question_option_c_when, question_option_d, question_option_d_when) {
  let text = `I just asked the interview question "${original_question}", and got the response "${question_answer}". Which question should I ask next?`

  if (question_option_a) {
    text = text + ` Question A: "${question_option_a}". Question A would be best to ask when  ${question_option_a_when}`
  }
  if (question_option_b) {
    if (question_option_b == "NO_QUESTION") {
      text = text + ` Question NO: I could also not ask a follow up question. This would be best to do when ${question_option_b_when}. If this is what I should do, respond with NO.`
    } else {
      text = text + ` Question B: "${question_option_b}". Question B would be best to ask when  ${question_option_b_when}`
    }
  }
  if (question_option_c) {
    if (question_option_c == "NO_QUESTION") {
      text = text + ` Question NO: I could also not ask a follow up question. This would be best to do when ${question_option_c_when}. If this is what I should do, respond with NO.`
    } else {
      text = text + ` Question C: "${question_option_c}". Question C would be best to ask when  ${question_option_c_when}`
    }
  }
  if (question_option_d) {
    if (question_option_d == "NO_QUESTION") {
      text = text + ` Question NO: I could also not ask a follow up question. This would be best to do when ${question_option_d_when}. If this is what I should do, respond with NO.`
    } else {
      text = text + ` Question D: "${question_option_d}". Question D would be best to ask when  ${question_option_d_when}`
    }
  }

  text = text + " Please respond with only the letter of the question you would choose. Best question:"
  console.log(text)
  
  const parts = [
    {text}
  ]

  console.log(parts)
  return(parts)
}

export async function GET({ url }) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  
  const original_question = url.searchParams.get('original_question'),
        question_answer = url.searchParams.get('question_answer'),
        question_option_a = url.searchParams.get('question_option_a'),
        question_option_a_when = url.searchParams.get('question_option_a_when'),
        question_option_b = url.searchParams.get('question_option_b'),
        question_option_b_when = url.searchParams.get('question_option_b_when'),
        question_option_c = url.searchParams.get('question_option_c'),
        question_option_c_when = url.searchParams.get('question_option_c_when'),
        question_option_d = url.searchParams.get('question_option_d'),
        question_option_d_when = url.searchParams.get('question_option_d_when');
  
  if (question_option_a && !question_option_b && !question_option_c) { // If there's only one question option submitted (i.e. A an not B or C), skip the generration and just return A
    return json("A")
  }
        
  let parts = prompt(original_question, question_answer, question_option_a, question_option_a_when, question_option_b, question_option_b_when, question_option_c, question_option_c_when, question_option_d, question_option_d_when) // Create a prompt using each variable
  
  const result = await model.generateContent({ // Generate the result
    contents: [{ role: "user", parts }],
    generationConfig,
    safetySettings,
  });

  let response = result.response.text(); // Grab the text out from the result that the AI gives

  return json(response) // Return the response
}