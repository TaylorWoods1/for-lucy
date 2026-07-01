import { CONFIG } from './config.js';

const { name } = CONFIG;

const TIPS = {
  period: [
    [
      `Comfort over productivity — a heating pad, ${name}'s favorite snack, or taking something off her plate goes a long way.`,
      `Low energy is normal for ${name} right now. Offer to handle dinner or errands without her having to ask.`,
      `Check in gently: "How are you feeling?" beats "You seem off today."`,
    ],
    [
      `This is a rest phase for ${name}. Cancel optional plans if she needs downtime.`,
      'Small acts matter — tea, chocolate, or just sitting with her without fixing anything.',
      `Don't take irritability personally. ${name}'s body is doing a lot right now.`,
    ],
  ],
  follicular: [
    [
      `${name}'s energy is rising — great time to plan a date night or fun outing together.`,
      'She may feel more social and optimistic. Match her energy.',
      'Good window for tackling projects together or starting something new.',
    ],
    [
      `${name}'s mood tends to lift during this phase. Enjoy it together.`,
      `Ask ${name} what she'd like to do this week — she might be up for adventures.`,
      'Communication flows easier now. Good time for bigger conversations.',
    ],
  ],
  ovulation: [
    [
      `Peak energy for ${name} — she may feel her best right now.`,
      'Great time for quality time, intimacy, and shared activities.',
      `Compliments land especially well with ${name} during this window.`,
    ],
    [
      `${name} is likely at her most vibrant. Plan something special if you can.`,
      'High energy phase — good for active dates or social events.',
      `Be present and engaged. ${name} will notice and appreciate it.`,
    ],
  ],
  luteal: [
    [
      `${name}'s energy may start dipping. Offer to handle dinner or reduce her mental load.`,
      `Patience is key — don't take ${name}'s mood shifts personally.`,
      'Ask "What would help right now?" instead of trying to fix things.',
    ],
    [
      `${name} might feel more inward. Give her space without disappearing.`,
      'Help with logistics — groceries, kids, chores — before she has to ask.',
      `A small surprise for ${name} — flowers, her favorite treat — can brighten a tougher day.`,
    ],
  ],
  pms: [
    [
      `Extra kindness goes far with ${name}. Reduce friction — skip debates over small things.`,
      `Stock up on comfort items ${name} likes before she has to ask.`,
      'Don\'t say "Are you PMSing?" — ever. Just be supportive.',
    ],
    [
      `${name}'s mood swings are hormonal, not personal. Stay steady and calm.`,
      'Offer physical comfort — hugs, back rubs, warmth — without expectation.',
      `Take on more household tasks this week. ${name} will feel the difference.`,
    ],
  ],
};

function getTipsForPhase(phase) {
  const sets = TIPS[phase] || TIPS.luteal;
  const index = Math.floor(Date.now() / 86400000) % sets.length;
  return sets[index];
}

export { getTipsForPhase, TIPS };
