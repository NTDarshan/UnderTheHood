import { Component, signal } from '@angular/core';

interface Term {
  name: string;
  simple: string;
  technical: string;
  visual: string;
  example: string;
  related: string[];
}

const TERMS: Term[] = [
  {
    name: 'Dataset',
    simple: 'The whole pile of examples you show the model so it can learn from them.',
    technical: 'A structured collection of samples, each described by the same set of features (and, for supervised tasks, a label), used for training and/or evaluating a model.',
    visual: 'a table with rows and columns — each row is one example',
    example: '10,000 rows of house sales, each with square footage, bedrooms, and sale price.',
    related: ['Sample', 'Feature', 'Label'],
  },
  {
    name: 'Feature',
    simple: 'One measurable thing about an example that the model is allowed to look at.',
    technical: 'An input variable — one dimension of the vector describing a sample — used by the model to produce a prediction.',
    visual: 'one column in the dataset table, or one axis in feature space',
    example: 'Square footage is a feature of a house; so is number of bedrooms.',
    related: ['Dataset', 'Sample', 'Label'],
  },
  {
    name: 'Label',
    simple: 'The correct answer attached to a training example, which the model tries to learn to predict.',
    technical: 'The known target value associated with a training sample in supervised learning; the ground-truth output the model is trained to reproduce.',
    visual: 'an extra column, marked "answer," sitting apart from the feature columns',
    example: 'The actual sale price recorded for each house in the training set.',
    related: ['Target', 'Feature', 'Training'],
  },
  {
    name: 'Target',
    simple: 'What the model is ultimately trying to predict — the same idea as a label, just the more general name for it.',
    technical: 'The variable a model is trained to predict; "label" is the term used for this when the value is already known and attached to training data, while "target" is used more generally, including at prediction time when the true value is unknown.',
    visual: 'the thing the arrow from the model points at',
    example: 'Sale price is the target of a house-pricing model, whether or not we know it yet.',
    related: ['Label', 'Prediction', 'Regression'],
  },
  {
    name: 'Sample',
    simple: 'One single example from the dataset — one row.',
    technical: 'A single data point: one instance from the dataset, represented as a vector of feature values (plus a label, if supervised).',
    visual: 'one row of the table, or one dot plotted in feature space',
    example: 'One specific house — its size, bedroom count, and price — is one sample.',
    related: ['Dataset', 'Feature', 'Instance-based learning'],
  },
  {
    name: 'Model',
    simple: 'The thing that has learned patterns from data and can now make predictions on new inputs.',
    technical: 'A function, with internal parameters fitted from training data, that maps input features to a prediction.',
    visual: 'the fitted line, plane, or curve drawn through the data',
    example: 'A specific line y = 2.3x + 4 fitted to house-price data is the model.',
    related: ['Parameter', 'Training', 'Prediction'],
  },
  {
    name: 'Parameter',
    simple: 'A number inside the model that gets adjusted automatically as it learns.',
    technical: "A value internal to the model that is learned from data during training (e.g. a line's slope and intercept). This is distinct from a hyperparameter, which is a setting chosen before training begins (like K in K-nearest neighbors) and is not learned from the data at all.",
    visual: 'the slope and intercept numbers baked into the fitted line',
    example: 'In y = mx + b, both m and b are parameters learned from the training data.',
    related: ['Model', 'Training', 'Model-based learning'],
  },
  {
    name: 'Prediction',
    simple: "The model's guess for a given input.",
    technical: 'The output ŷ produced by a trained model for a given input — an estimate of the target, to be compared against the true value y when one is available.',
    visual: 'the point on the fitted line directly above/below an input, at the moment of inference',
    example: 'Feeding a house\'s size into the model and getting back ŷ = $412,000.',
    related: ['Model', 'Inference', 'Residual'],
  },
  {
    name: 'Training',
    simple: 'The process of showing the model examples and letting it adjust itself to fit them.',
    technical: 'The phase in which a learning algorithm adjusts a model\'s parameters using training data, typically by minimizing a loss function.',
    visual: 'the line rotating and shifting step by step until it settles among the points',
    example: 'Running gradient descent on 10,000 house sales until the line stops moving much.',
    related: ['Model', 'Loss', 'Inference'],
  },
  {
    name: 'Inference',
    simple: 'Using an already-trained model to make a prediction on new data.',
    technical: "The phase in which a trained model's fixed parameters are applied to a new, previously unseen input to produce a prediction — no further learning occurs.",
    visual: 'a new dot appearing off to the side, with an arrow pointing to where it lands on the already-fixed line',
    example: 'Plugging a brand-new listing into the trained model to get a price estimate.',
    related: ['Training', 'Prediction', 'Model'],
  },
  {
    name: 'Regression',
    simple: 'Predicting a number that can take many possible values, like a price or a temperature.',
    technical: 'A supervised learning task where the target is a continuous numeric value, and the model is evaluated by how close its predictions are to that value.',
    visual: 'a line or curve fitted through scattered points on a number line',
    example: 'Predicting a house\'s exact sale price in dollars.',
    related: ['Classification', 'Target', 'Loss'],
  },
  {
    name: 'Classification',
    simple: 'Predicting which category something belongs to, out of a fixed set of options.',
    technical: 'A supervised learning task where the target is a discrete class label, and the model is evaluated by whether its predicted category matches the true one.',
    visual: 'a boundary line separating two clusters of differently-colored dots',
    example: 'Predicting whether an email is "spam" or "not spam."',
    related: ['Regression', 'Hyperplane', 'Distance'],
  },
  {
    name: 'Clustering',
    simple: 'Grouping similar examples together automatically, without being told the group names in advance.',
    technical: 'An unsupervised learning task that partitions unlabeled samples into groups based on similarity, typically measured by distance in feature space, without predefined class labels.',
    visual: 'dots on a plane spontaneously separating into colored blobs with no labels given beforehand',
    example: 'Grouping customers into segments based on purchasing behavior, with no predefined segment names.',
    related: ['Distance', 'Feature', 'Model-based learning'],
  },
  {
    name: 'Distance',
    simple: 'A number measuring how far apart two examples are from each other.',
    technical: 'A metric (e.g. Euclidean distance) quantifying dissimilarity between two points in feature space; smaller distance implies greater similarity under that metric.',
    visual: 'the straight ruler-line drawn between two dots in feature space',
    example: 'Measuring how close a new house is, in size and bedrooms, to houses already sold.',
    related: ['Instance-based learning', 'Hyperplane', 'Clustering'],
  },
  {
    name: 'Loss',
    simple: 'A single score that says how badly the model is doing overall, which training tries to shrink.',
    technical: "A function of the model's parameters that aggregates prediction error across samples into one scalar that training minimizes. Mean Squared Error is one common choice of loss function for regression, not the only one — different tasks use different loss functions (e.g. cross-entropy for classification).",
    visual: 'a single number at the bottom of the screen that ticks downward as training runs',
    example: 'Mean Squared Error across all training houses, computed after each training step.',
    related: ['Training', 'Error', 'Residual'],
  },
  {
    name: 'Error',
    simple: "How far off the model's guess is for one particular example.",
    technical: "The difference between a model's prediction ŷ and the true value y for a single sample (y − ŷ); loss is what you get after aggregating error across many samples into one number to be minimized.",
    visual: 'the vertical gap between one dot and the line, for that one dot only',
    example: 'The model predicted $400,000, but the house sold for $415,000 — an error of $15,000.',
    related: ['Residual', 'Loss', 'Prediction'],
  },
  {
    name: 'Residual',
    simple: 'Another name for the leftover gap between a prediction and reality, usually used when talking about a fitted regression line.',
    technical: "Synonymous with error in the regression setting: the signed difference y − ŷ for a single observation, after fitting a model — what's left over, unexplained by the line.",
    visual: 'the dashed vertical gap between a dot and the line',
    example: 'A house sits above the fitted line; the residual is the length of the dashed segment connecting them.',
    related: ['Error', 'Loss', 'Regression'],
  },
  {
    name: 'Hyperplane',
    simple: 'A flat divider that splits space into two sides, generalized to work in any number of dimensions.',
    technical: 'A flat, (n−1)-dimensional subspace of an n-dimensional feature space (a point in 1D, a line in 2D, a plane in 3D, and a conceptual, non-visualizable generalization in higher dimensions) often used as a decision boundary.',
    visual: 'a line in 2D or a flat plane in 3D — in higher dimensions, imagined rather than drawn',
    example: 'A decision boundary separating spam from not-spam across dozens of email features at once.',
    related: ['Classification', 'Distance', 'Feature'],
  },
  {
    name: 'Instance-based learning',
    simple: 'Learning by memorizing all the examples and comparing new cases directly against them, instead of building a general formula.',
    technical: 'A learning approach that stores the training samples themselves and defers generalization until prediction time, computing distances to stored instances (e.g. K-Nearest Neighbors) rather than fitting a fixed parametric model.',
    visual: 'no line at all — just the stored dots, with new points classified by looking at their nearest neighbors',
    example: 'K-Nearest Neighbors deciding a new house\'s price bracket by checking its 5 closest stored neighbors.',
    related: ['Model-based learning', 'Distance', 'Sample'],
  },
  {
    name: 'Model-based learning',
    simple: 'Learning by fitting a compact formula to the data, then using that formula alone for future predictions.',
    technical: 'A learning approach that fits a fixed set of parameters to a chosen model form during training; at inference time only the learned parameters are used to predict — the original training data is not required for every prediction.',
    visual: 'a single fitted line or plane; the raw training dots can vanish and it still works',
    example: 'A linear regression line, once fitted, predicts new house prices without re-checking the original sales data.',
    related: ['Instance-based learning', 'Parameter', 'Training'],
  },
];

@Component({
  selector: 'app-ml-terminology-map',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="terminology">
      <div class="container">
        <p class="lab-index">MACHINE LEARNING / 024 — CONNECTED TERMS, NOT A GLOSSARY</p>
        <h2 class="lab-title">Every term here means something because of the terms around it.</h2>
        <p class="lab-lede">
          Click a term to unpack it — plain language, the precise definition, how to picture it, and a
          concrete example. Then follow the related terms to see how the whole vocabulary connects.
        </p>

        <div class="term-grid">
          @for (t of terms; track t.name) {
            <button
              type="button"
              class="lab-btn term-chip"
              [class.is-active]="selected().name === t.name"
              (click)="select(t)"
            >
              {{ t.name }}
            </button>
          }
        </div>

        <div class="lab-panel detail-panel">
          <p class="detail-name">{{ selected().name }}</p>

          <div class="detail-block">
            <p class="detail-label mono">PLAIN LANGUAGE</p>
            <p class="detail-text">{{ selected().simple }}</p>
          </div>

          <div class="detail-block">
            <p class="detail-label mono">TECHNICAL DEFINITION</p>
            <p class="detail-text">{{ selected().technical }}</p>
          </div>

          <div class="detail-block">
            <p class="detail-label mono">HOW TO PICTURE IT</p>
            <p class="detail-text">{{ selected().visual }}</p>
          </div>

          <div class="detail-block">
            <p class="detail-label mono">EXAMPLE</p>
            <p class="detail-text">{{ selected().example }}</p>
          </div>

          <div class="detail-block related-block">
            <p class="detail-label mono">RELATED TERMS</p>
            <div class="related-row">
              @for (r of selected().related; track r) {
                <button type="button" class="lab-btn related-chip" (click)="selectByName(r)">{{ r }}</button>
              }
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .term-grid { margin-top: 24px; display: flex; flex-wrap: wrap; gap: 10px; }
    .term-chip { font-size: 0.8125rem; }

    .detail-panel { margin-top: 24px; }
    .detail-name { font-size: 1.375rem; font-weight: 700; color: var(--accent-strong); }

    .detail-block { margin-top: 18px; }
    .detail-block:first-of-type { margin-top: 20px; }
    .detail-label { font-size: 0.6875rem; color: var(--accent-2); letter-spacing: 0.06em; margin-bottom: 6px; }
    .detail-text { font-size: 0.9375rem; color: var(--text-muted); line-height: 1.55; }

    .related-block { padding-top: 16px; border-top: 1px solid var(--border); }
    .related-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .related-chip { font-size: 0.75rem; padding: 6px 12px; color: var(--text-muted); }
    .related-chip:hover { color: var(--text); }
  `,
})
export class MlTerminologyMap {
  protected readonly terms = TERMS;
  protected readonly selected = signal<Term>(TERMS[0]);

  select(t: Term): void {
    this.selected.set(t);
  }

  selectByName(name: string): void {
    const t = this.terms.find((term) => term.name === name);
    if (t) this.selected.set(t);
  }
}
