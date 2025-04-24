import {
  AutoTokenizer,
  AutoModelForCausalLM,
  TextStreamer,
  InterruptableStoppingCriteria,
} from "@huggingface/transformers";

class TransformerService {
  static model_id = "onnx-community/Llama-3.2-1B-Instruct-q4f16";
  static tokenizer = null;
  static model = null;
  static stopping_criteria = new InterruptableStoppingCriteria();

  static async initialize(progressCallback = null) {
    if (!this.tokenizer || !this.model) {
      this.tokenizer = await AutoTokenizer.from_pretrained(this.model_id, {
        progress_callback: progressCallback,
      });

      this.model = await AutoModelForCausalLM.from_pretrained(this.model_id, {
        dtype: "q4f16",
        device: "webgpu",
        progress_callback: progressCallback,
      });
    }
    return { tokenizer: this.tokenizer, model: this.model };
  }

  static async generateCompanySummary(jobDescription) {
    const prompt = `Based on the following job description, summarize what working at this company might be like.
                   Focus on company culture, work environment, and potential growth opportunities.
                   Job Description: ${jobDescription}
                   Please provide a concise summary in 2-3 paragraphs.`;

    const { tokenizer, model } = await this.initialize();
    const inputs = tokenizer(prompt, { return_tensors: "pt" });
    let generatedText = '';

    const streamer = new TextStreamer(tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: (token) => {
        generatedText += token;
      }
    });

    await model.generate({
      ...inputs,
      max_new_tokens: 500,
      do_sample: false,
      streamer,
      stopping_criteria: this.stopping_criteria,
    });

    return generatedText;
  }

  static async detectSpam(jobDescription, companyName, salary) {
    const prompt = `Analyze the following job posting for potential spam or scam indicators.
                   Consider factors like unrealistic salary promises, vague descriptions, and suspicious requirements.
                   
                   Job Description: ${jobDescription}
                   Company Name: ${companyName}
                   Salary: ${salary}
                   
                   Respond with either "SPAM" or "LEGITIMATE" followed by a brief explanation.`;

    const { tokenizer, model } = await this.initialize();
    const inputs = tokenizer(prompt, { return_tensors: "pt" });
    let generatedText = '';

    const streamer = new TextStreamer(tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: (token) => {
        generatedText += token;
      }
    });

    await model.generate({
      ...inputs,
      max_new_tokens: 300,
      do_sample: false,
      streamer,
      stopping_criteria: this.stopping_criteria,
    });

    const isSpam = generatedText.toLowerCase().includes('spam');
    const explanation = generatedText.split('\n')[1] || '';

    return {
      isSpam,
      explanation
    };
  }
}

export default TransformerService; 