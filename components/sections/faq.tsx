import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'Is this software actually HIPAA compliant?',
    answer: 'We follow basic security practices like data encryption and secure transmission, but HIPAA compliance is mostly about YOUR processes, training, and documentation. This tool helps you track compliance tasks, but you\'re still responsible for staff training, proper procedures, and most of the actual compliance work. We\'re not HIPAA experts - consult a compliance attorney for real legal advice.',
  },
  {
    question: 'What does this actually do that a spreadsheet can\'t?',
    answer: 'Honestly? Not a huge amount. It sends email reminders, has a nicer interface than Excel, and stores everything in one place. If you\'re comfortable with spreadsheets and calendar reminders, you might not need this. It\'s really for practices that want something simple and don\'t want to build their own system.',
  },
  {
    question: 'Is the 14-day trial actually free?',
    answer: 'Yes, completely free. No credit card required upfront. After 14 days, your account gets paused (not deleted) until you decide to pay or not. We keep your data for 30 days in case you change your mind, then delete it permanently.',
  },
  {
    question: 'Will this actually save me time?',
    answer: 'Maybe. You\'ll spend time setting it up initially and entering all your tasks/documents. If you already have a good system, this might not save you time. It\'s most helpful for practices that are currently disorganized or forget deadlines. Don\'t expect magic - it\'s basically a fancy to-do list with reminders.',
  },
  {
    question: 'What if I need help or have problems?',
    answer: 'We provide email support with 48-hour response times (weekdays only). This is a small operation, not a huge company with instant chat support. We\'ll help with basic setup questions, but we can\'t provide compliance advice or extensive hand-holding. There are some setup guides and basic documentation.',
  },
  {
    question: 'Is $49/month actually a good deal?',
    answer: 'It depends. Yes, it\'s cheaper than big compliance solutions that cost $200-500+/month. But those often include actual compliance expertise, training materials, and professional support. We\'re basically a digital organizer. If you just need task tracking and reminders, it might be worth it. If you need comprehensive compliance guidance, look elsewhere.',
  },
  {
    question: 'What happens if I cancel?',
    answer: 'You can export your data to PDF and CSV files before canceling. We don\'t make it difficult to leave. Your data gets deleted after 30 days, and we don\'t charge cancellation fees or try to lock you in. If you decide it\'s not worth $49/month, just cancel.',
  },
  {
    question: 'Do you integrate with other software?',
    answer: 'Not really. You can export data to CSV files to import elsewhere, but there are no fancy integrations with practice management software or other tools. This is a standalone system. API integrations might happen eventually, but don\'t count on it anytime soon.',
  },
  {
    question: 'Is this going to solve all my compliance problems?',
    answer: 'Absolutely not. This helps you track tasks and deadlines, but compliance is mostly about having proper procedures, training staff, and following regulations consistently. This won\'t make you compliant - it just helps you stay organized about compliance tasks you already know you need to do.',
  },
  {
    question: 'Are you going to be around in a year?',
    answer: 'Honestly, we don\'t know. This is a small business, not a huge established company. We\'re focused on keeping it simple and sustainable, but small software companies do sometimes fail. That\'s why we make data export easy and don\'t lock you into long-term contracts.',
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Honest Questions & Answers
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Real talk about what this compliance tracker actually does and doesn't do
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-3xl">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}