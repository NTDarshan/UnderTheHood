import { Component, OnDestroy, computed, signal } from '@angular/core';

interface InterviewQ {
  question: string;
  answerPoints: string[];
  followUp: string;
}

const QUESTIONS: InterviewQ[] = [
  {
    question: 'What is machine learning?',
    answerPoints: [
      'A way of building a function that maps inputs to outputs by fitting parameters to examples, rather than by a human writing explicit rules',
      'The "learning" is the automatic adjustment of internal parameters to reduce error on training data',
      'It trades hand-written logic for a general algorithm plus data — useful when the rules are too complex or too numerous to write by hand',
    ],
    followUp: 'Can you give an example of a task where hand-written rules would be impractical?',
  },
  {
    question: 'What is supervised learning?',
    answerPoints: [
      'Training a model on samples that each come with a known label or target',
      'The model learns by comparing its predictions against the true labels and adjusting to reduce the difference',
      'Covers both regression (continuous target) and classification (discrete target)',
    ],
    followUp: 'How would unsupervised learning differ from this, given there are no labels?',
  },
  {
    question: 'What is the difference between regression and classification?',
    answerPoints: [
      'Regression predicts a continuous numeric value (e.g. a price, a temperature)',
      'Classification predicts a discrete category from a fixed set of options (e.g. spam vs. not spam)',
      'The distinction is about the type of the target variable, not the algorithm family — some algorithms can be adapted to do either',
    ],
    followUp: 'Could the same underlying algorithm, like K-Nearest Neighbors, be used for both? How?',
  },
  {
    question: 'What is a feature?',
    answerPoints: [
      'An input variable describing a sample — one dimension of the vector fed into the model',
      'Features are chosen (or engineered) by whoever builds the dataset, and directly determine what the model is even capable of noticing',
      'Example: square footage and bedroom count are features of a house',
    ],
    followUp: 'What happens to a model\'s predictions if an important feature is left out entirely?',
  },
  {
    question: 'What is a label?',
    answerPoints: [
      'The known correct answer attached to a training sample in supervised learning',
      'It is what the model is trained to reproduce, by comparing its own prediction against it',
      'At prediction time on new data, there is no label yet — that is what the model is producing an estimate of',
    ],
    followUp: 'What term describes this same idea more generally, including before the true value is known?',
  },
  {
    question: 'What does y = mx + b represent?',
    answerPoints: [
      'The equation of a straight line: given an input x, it produces an output y',
      'm is the slope (how steeply y changes as x changes) and b is the intercept (the value of y when x is 0)',
      'As a model, it is the simplest form of linear regression — one feature x predicting one target y',
    ],
    followUp: 'How would this equation change with two input features instead of one?',
  },
  {
    question: 'What is slope?',
    answerPoints: [
      'The rate of change of the output relative to the input — how much y changes for a one-unit increase in x',
      'In y = mx + b, it is the coefficient m, and it is a parameter learned from the data, not chosen by hand',
      'Geometrically, it is the steepness (and direction — positive or negative) of the line',
    ],
    followUp: 'What would a slope of zero imply about the relationship between x and y?',
  },
  {
    question: 'What is an intercept?',
    answerPoints: [
      'The value of the output y when the input x is exactly 0',
      'In y = mx + b, it is the constant b, also a learned parameter',
      'Geometrically, it is the point where the line crosses the y-axis',
    ],
    followUp: 'Does an intercept of 0 always mean something meaningful about the real-world scenario being modeled?',
  },
  {
    question: 'What is a residual?',
    answerPoints: [
      'The signed difference between the true value y and the predicted value ŷ for one specific sample, after fitting a model',
      'It is what is "left over" — the amount the line failed to explain for that point',
      'Not the same as loss: loss aggregates residuals (or their transformations) across the whole dataset into one number to minimize',
    ],
    followUp: 'If most residuals are positive, what might that suggest about the fitted line\'s position?',
  },
  {
    question: 'Why square errors?',
    answerPoints: [
      'Squaring makes every residual positive, so positive and negative errors cannot cancel each other out when summed or averaged',
      'It penalizes larger errors disproportionately more than smaller ones, pushing the model to avoid big misses',
      'It produces a smooth, differentiable function, which is what makes gradient-based optimization (like gradient descent) practical',
      'Squaring is one choice — Mean Squared Error — not the only possible loss function; e.g. Mean Absolute Error avoids the extra penalty on large errors',
    ],
    followUp: 'In what situation might Mean Absolute Error be preferred over Mean Squared Error?',
  },
  {
    question: 'What is a plane?',
    answerPoints: [
      'A flat, two-dimensional surface embedded in three-dimensional space, defined by an equation like z = ax + by + c',
      'It is the natural extension of a line (1D) into one higher dimension — a model with two input features and one output',
      'Every point on the plane satisfies the equation exactly; points off the plane have some residual relative to it',
    ],
    followUp: 'How many parameters does this plane equation have, and what does each one control?',
  },
  {
    question: 'What is a hyperplane?',
    answerPoints: [
      'The generalization of a line or plane to any number of dimensions: a flat (n−1)-dimensional subspace within an n-dimensional feature space',
      'In 2D it is a line, in 3D it is a plane, and beyond 3D it cannot be directly visualized but the math still applies the same way',
      'Commonly used as a decision boundary in classification, separating feature space into regions',
    ],
    followUp: 'Why can a hyperplane still be useful in, say, 50-dimensional feature space, even though nobody can draw it?',
  },
  {
    question: 'How do you calculate the distance from a point to a plane?',
    answerPoints: [
      'For a plane defined as ax + by + cz + d = 0 and a point (x0, y0, z0), the distance is |a·x0 + b·y0 + c·z0 + d| divided by the magnitude of the normal vector, sqrt(a² + b² + c²)',
      'The numerator plugs the point into the plane equation — zero means the point lies exactly on the plane, and the further from zero, the further from the plane',
      'The denominator normalizes by the length of the plane\'s normal vector, so the result is a true geometric distance, not just an arbitrary number',
    ],
    followUp: 'Why does dividing by the normal vector\'s magnitude matter — what would go wrong without it?',
  },
  {
    question: 'What is instance-based learning?',
    answerPoints: [
      'A learning approach that stores the training samples themselves rather than fitting a fixed formula',
      'Generalization is deferred until prediction time: a new input is compared against stored instances, typically using distance',
      'K-Nearest Neighbors is the canonical example — there is no explicit training phase beyond storing the data',
    ],
    followUp: 'What does this approach cost in terms of memory and prediction-time speed, compared to a fitted model?',
  },
  {
    question: 'What is model-based learning?',
    answerPoints: [
      'A learning approach that fits a fixed set of parameters (like a line\'s slope and intercept) to the training data during a dedicated training phase',
      'Once trained, predictions only require the learned parameters — the original training data does not need to be kept or re-examined for each prediction',
      'Note: this does not mean the training data is deleted or discarded as a rule — it simply is not required at inference time the way it is for instance-based methods',
    ],
    followUp: 'Why might model-based learning make predictions faster than instance-based learning at scale?',
  },
  {
    question: 'Why does feature scaling matter for distance-based algorithms?',
    answerPoints: [
      'Distance metrics like Euclidean distance sum up differences across all features, so a feature measured on a much larger numeric scale dominates the distance calculation',
      'Without scaling, a feature like "income in dollars" (thousands) would drown out a feature like "age in years" (tens), even if age is just as predictive',
      'Standardizing or normalizing features puts them on comparable scales, so distance reflects genuine similarity rather than arbitrary units',
    ],
    followUp: 'Would this same concern apply to a linear regression model fit by gradient descent? Why or why not?',
  },
  {
    question: 'What is the difference between training and inference?',
    answerPoints: [
      'Training is the phase where the model\'s parameters are adjusted using labeled data, typically by minimizing a loss function',
      'Inference is the phase where the already-trained, fixed parameters are applied to new input to produce a prediction — no further learning happens',
      'Training happens once (or periodically); inference happens every time the model is asked to make a prediction on new data',
    ],
    followUp: 'What would it mean, practically, if a model kept updating its parameters during inference?',
  },
];

@Component({
  selector: 'app-ml-interview-mode',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="interview-mode">
      <div class="container">
        <p class="lab-index">MACHINE LEARNING / 025 — CAN YOU EXPLAIN THIS?</p>
        <h2 class="lab-title">Could you explain this out loud, under pressure?</h2>

        <div class="lab-panel">
          <p class="interviewer mono">INTERVIEWER</p>
          <p class="q-text">{{ current().question }}</p>

          @if (!revealed()) {
            <div class="timer-row">
              <p class="timer mono">{{ seconds() }}s</p>
              <div class="lab-btn-row">
                <button type="button" class="lab-btn lab-btn-primary" (click)="reveal()">Reveal Ideal Answer</button>
              </div>
            </div>
          } @else {
            <div class="answer-box">
              <p class="answer-title mono">IDEAL ANSWER STRUCTURE</p>
              <ol class="answer-list">
                @for (p of current().answerPoints; track p) {
                  <li>{{ p }}</li>
                }
              </ol>
              <p class="followup-title mono">LIKELY FOLLOW-UP</p>
              <p class="followup-text">{{ current().followUp }}</p>
            </div>
          }

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" [disabled]="index() === 0" (click)="prev()">← Previous</button>
            <button type="button" class="lab-btn" [disabled]="index() === questions.length - 1" (click)="next()">Next Question →</button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .interviewer { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.06em; }
    .q-text { margin-top: 8px; font-size: 1.125rem; color: var(--text); font-weight: 600; }

    .timer-row { margin-top: 20px; display: flex; align-items: center; gap: 20px; }
    .timer { font-size: 1.5rem; color: var(--accent-strong); }

    .answer-box { margin-top: 20px; padding: 16px 18px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .answer-title { font-size: 0.6875rem; color: var(--accent-2); letter-spacing: 0.06em; margin-bottom: 10px; }
    .answer-list { display: flex; flex-direction: column; gap: 6px; counter-reset: pt; list-style: decimal; padding-left: 20px; }
    .answer-list li { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }

    .followup-title { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); font-size: 0.6875rem; color: var(--accent); letter-spacing: 0.06em; margin-bottom: 8px; }
    .followup-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; font-style: italic; }
  `,
})
export class MlInterviewMode implements OnDestroy {
  protected readonly questions = QUESTIONS;
  protected readonly index = signal(0);
  protected readonly revealed = signal(false);
  protected readonly seconds = signal(60);
  protected readonly current = computed(() => this.questions[this.index()]);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startTimer();
  }

  private startTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.seconds.set(60);
    this.timer = setInterval(() => {
      this.seconds.update((s) => {
        if (s <= 1) {
          this.reveal();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  reveal(): void {
    this.revealed.set(true);
    if (this.timer) clearInterval(this.timer);
  }

  next(): void {
    this.index.update((i) => Math.min(i + 1, this.questions.length - 1));
    this.revealed.set(false);
    this.startTimer();
  }

  prev(): void {
    this.index.update((i) => Math.max(i - 1, 0));
    this.revealed.set(false);
    this.startTimer();
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
