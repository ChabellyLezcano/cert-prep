import { describe, expect, it } from 'vitest';
import { classifyDomain, parsePracticeSet } from '../scripts/lib/practiceSetParser';

const SAMPLE = `
1. Question
Which service stores objects durably?

Service Alpha
Service Beta
Service Gamma
Service Delta
 Unattempted
Correct
Option B. Service Beta
Beta stores objects durably.
Incorrect
Option A. Service Alpha
Not an object store.

2. Question
Pick the right pair of tiers.
A. Tier one for the web layer
B. Tier two for the web layer
C. Tier one for the data layer
D. Tier two for the data layer
 Unattempted
Correct
Option A. Tier one for the web layer
Option D. Tier two for the data layer
Incorrect
Option B. Tier two for the web layer

3. Question
Which options apply? (choose 2)

Use feature red
Use feature green
Use feature blue
Use feature pink
Use feature gold
 Unattempted
Some context first.
CORRECT: “Use feature green” is the correct answer.
CORRECT: “Use feature gold” is a correct answer.
INCORRECT: “Use feature red” is incorrect.
Topic: example/topic/path

4. Question
What is the best approach here?
Approach one
Approach two
Approach three
Approach four
 Unattempted
Exam Tip
Just remember the keyword.

5. Question
Which database fits a key-value workload?
Relational engine
Wide table store
C. Document store
Cache layer
 Unattempted
The documentation says a document store is the natural fit for this workload. ✅
Why Other Options Are Incorrect:
A relational engine does not fit.

6. Question
Which of these is a security feature?
Choice one
Choice two
Choice three
Choice four
Choice five
 Unattempted
Correct
Option C. Choice three
Incorrect
Option E. Choice five
It is listed only to prove five options exist.

7. Question
This block never says its state.
Only text here.

8. Question
Which choices help? (Select TWO.)
Alpha
Beta
Gamma
Delta
Epsilon
 Unattempted
Only one is mentioned: Gamma works here.
Use Page numbers below to navigate to other practice tests
Pages: 1 2 3
`;

describe('parsePracticeSet', () => {
  const result = parsePracticeSet(SAMPLE);
  const byN = (n: number) => result.questions.find((q) => q.n === n)!;

  it('parses a plain four-option question and resolves it from the Option letter', () => {
    expect(byN(1)).toMatchObject({
      question: 'Which service stores objects durably?',
      options: ['Service Alpha', 'Service Beta', 'Service Gamma', 'Service Delta'],
      answers: [1],
      multi: false,
    });
    expect(byN(1).explanation).toContain('Beta stores objects durably.');
  });

  it('parses lettered options and multiple correct letters', () => {
    expect(byN(2).options).toHaveLength(4);
    expect(byN(2).options[0]).toBe('Tier one for the web layer');
    expect(byN(2)).toMatchObject({ answers: [0, 3], multi: true });
  });

  it('parses a choose-two question with five options and quoted answers', () => {
    expect(byN(3).options).toHaveLength(5);
    expect(byN(3)).toMatchObject({ answers: [1, 4], multi: true });
    expect(byN(3).explanation).not.toContain('Topic:');
  });

  it('flags questions whose answer cannot be determined', () => {
    expect(result.unresolved).toContain(4);
    expect(byN(4)).toMatchObject({ answers: [], multi: false });
  });

  it('strips a stray letter prefix and resolves from option text mentioned before the incorrect section', () => {
    expect(byN(5).options[2]).toBe('Document store');
    expect(byN(5).answers).toEqual([2]);
    expect(byN(5).explanation).not.toContain('✅');
  });

  it('infers five options from an Option E mention', () => {
    expect(byN(6).options).toHaveLength(5);
    expect(byN(6).answers).toEqual([2]);
  });

  it('reports blocks without a state line as malformed', () => {
    expect(result.malformed).toEqual([7]);
    expect(result.questions.map((q) => q.n)).not.toContain(7);
  });

  it('keeps a multi flag when a choose-two answer is unresolved, and ignores the page footer', () => {
    expect(result.unresolved).toContain(8);
    expect(byN(8)).toMatchObject({ answers: [], multi: true });
    expect(byN(8).explanation).not.toContain('Pages:');
  });
});

describe('classifyDomain', () => {
  it.each([
    ['Encrypt the bucket with KMS and an IAM policy', 'SEC'],
    ['Use CloudFront to cache content and cut latency', 'PERF'],
    ['Move cold data to Glacier with a lifecycle rule for the lowest cost', 'COST'],
    ['Enable Multi-AZ failover with a read replica', 'RES'],
    ['Nothing recognisable here', 'RES'],
  ])('classifies %j as %s', (text, expected) => {
    expect(classifyDomain(text)).toBe(expected);
  });
});
