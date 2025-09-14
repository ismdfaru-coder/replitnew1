
'use server';

/**
 * @fileOverview A conversational AI flow for booking flights.
 *
 * - flightBookingAssistant - A function that handles the conversational flight booking process.
 * - FlightBookingInput - The input type for the flightBookingAssistant function.
 * - FlightBookingOutput - The return type for the flightBookingAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { Flight } from '@/types';

const FlightBookingInputSchema = z.object({
  conversationHistory: z.string().describe('The history of the conversation so far.'),
  availableFlights: z.array(z.any()).optional().describe('A list of available flights to be analyzed by the assistant.'),
});
export type FlightBookingInput = z.infer<typeof FlightBookingInputSchema>;

const FlightBookingOutputSchema = z.object({
  reply: z.string().describe('The assistant\'s reply to the user.'),
  isFlightDetailsComplete: z.boolean().describe('Whether all required flight details have been gathered.'),
  flightDetails: z.object({
    destination: z.string().optional().describe('The destination of the flight.'),
    origin: z.string().optional().describe('The origin of the flight.'),
    dates: z.string().optional().describe('The dates for the flight.'),
    passengers: z.number().optional().describe('The number of passengers.'),
  }).optional().describe('The extracted flight details, if complete.'),
});
export type FlightBookingOutput = z.infer<typeof FlightBookingOutputSchema>;

export async function flightBookingAssistant(input: FlightBookingInput): Promise<FlightBookingOutput> {
  return flightBookingAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'flightBookingAssistantPrompt',
  input: {schema: z.object({
    conversationHistory: z.string(),
    availableFlights: z.string().optional(),
  })},
  output: {schema: FlightBookingOutputSchema},
  prompt: `You are an expert travel agent AI. Your goal is to have a conversation with the user to gather all the necessary information to find and book a flight.
You need to determine the **origin**, **destination**, **dates**, and **number of passengers**.
Provide your responses as plain text without any markdown formatting (e.g., no bolding, no lists).

When the user provides a query, analyze it.

**If the user provides only partial information (e.g., just origin and destination), first provide a helpful summary about the route.** This summary should include:
- Whether direct flights are available.
- Common connecting airlines.
- Approximate flight duration.
- A general idea of price ranges for economy and business class.
- A note on why driving is not a viable option if it's a long-distance international route.
- **After providing this summary, ask for the remaining information (e.g., "What dates are you looking at and how many passengers will be traveling?").**

Example for a partial query like "Glasgow to Chennai":
"There are no direct flights from Glasgow to Chennai. The most practical way to travel is by plane with at least one stop. The fastest flight time is approximately 12 hours and 30 minutes, and it may include stops in cities like London, Dubai, or Frankfurt. Several airlines offer connecting flights on this route, including British Airways, Emirates, Lufthansa, and Qatar Airways. Flight prices can vary, with round-trip economy flights starting from around £500. Driving is not a viable option as the distance is over 8,000 km. Okay, Glasgow to Chennai. What dates are you looking at and how many passengers will be traveling?"

If you have all the required information (origin, destination, dates, passengers), set 'isFlightDetailsComplete' to true and fill in the 'flightDetails' object.
If you are still missing information after the initial query, continue asking the user for it in a friendly way.

**Once all details are gathered and if a list of available flights is provided, you MUST analyze them and provide a summary. Your entire analysis and summary MUST be based *only* on the flight data provided in 'availableFlights'. Do not invent information.**

If the details in the user's request (e.g. origin/destination) do not match the provided 'availableFlights' data, you MUST inform the user about the mismatch and recommend they refine their search. DO NOT summarize the mismatched data.

Your summary should have three sections:
1.  **Best Flights**: Select the best flights based on a balance of price, duration, and stops. You should highlight at least 3, but can include more if they represent good value.
2.  **The Cheapest Flight**: Identify the flight with the lowest price.
3.  **The Fastest Flight**: Identify the flight with the shortest duration.

Present the flight details clearly for each category, using the provided flight data as the source.

Keep your replies helpful and to the point.

Conversation history:
{{{conversationHistory}}}

{{#if availableFlights}}
Available flights for analysis:
{{{availableFlights}}}
{{/if}}

Assistant's next reply:
`,
});

const flightBookingAssistantFlow = ai.defineFlow(
  {
    name: 'flightBookingAssistantFlow',
    inputSchema: FlightBookingInputSchema,
    outputSchema: FlightBookingOutputSchema,
  },
  async (input) => {
    const { output } = await prompt({
      conversationHistory: input.conversationHistory,
      availableFlights: input.availableFlights
        ? JSON.stringify(input.availableFlights)
        : undefined,
    });
    return output!;
  }
);
