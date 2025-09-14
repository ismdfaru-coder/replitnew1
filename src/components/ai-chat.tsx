
"use client";

import { useEffect, useState, useRef } from "react";
import { flightBookingAssistant, type FlightBookingInput } from "@/ai/flows/flight-booking-assistant";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Bot, Loader2, User } from "lucide-react";
import FlightResultsView from "./flight-results-view";
import { type Flight } from "@/types";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const mockFlights: Flight[] = [
    { id: '1', provider: 'Emirates', legs: [{ airline: 'Emirates', airlineLogoUrl: 'https://picsum.photos/40/40?random=1', departureTime: '14:35', arrivalTime: '08:05', duration: '13h 30m', stops: '1 stop' }, { airline: 'Emirates', airlineLogoUrl: 'https://picsum.photos/40/40?random=1', departureTime: '04:00', arrivalTime: '12:45', duration: '12h 15m', stops: '1 stop' }], price: 843, from: { code: 'GLA', time: '14:35', airport: 'Glasgow' }, to: { code: 'MAA', time: '08:05', airport: 'Chennai' }, duration: '13h 30m', stops: 1, airline: 'Emirates' },
    { id: '2', provider: 'Wizz Air', legs: [{ airline: 'Wizz Air', airlineLogoUrl: 'https://picsum.photos/40/40?random=2', departureTime: '06:55', arrivalTime: '03:30', duration: '16h 05m', stops: '1 stop' }, { airline: 'Wizz Air', airlineLogoUrl: 'https://picsum.photos/40/40?random=2', departureTime: '05:35', arrivalTime: '15:35', duration: '14h 30m', stops: '1 stop' }], price: 553, from: { code: 'GLA', time: '06:55', airport: 'Glasgow' }, to: { code: 'MAA', time: '03:30', airport: 'Chennai' }, duration: '16h 05m', stops: 1, airline: 'Wizz Air' },
    { id: '3', provider: 'Lufthansa', legs: [{ airline: 'Lufthansa', airlineLogoUrl: 'https://picsum.photos/40/40?random=3', departureTime: '06:10', arrivalTime: '00:10', duration: '13h 30m', stops: '1 stop' }, { airline: 'Lufthansa', airlineLogoUrl: 'https://picsum.photos/40/40?random=3', departureTime: '01:55', arrivalTime: '12:25', duration: '15h 00m', stops: '1 stop' }], price: 674, from: { code: 'GLA', time: '06:10', airport: 'Glasgow' }, to: { code: 'MAA', time: '00:10', airport: 'Chennai' }, duration: '13h 30m', stops: 1, airline: 'Lufthansa' },
];

export function AIChat({ initialQuery }: { initialQuery?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [flightQuery, setFlightQuery] = useState<string | null>(null);
  const processedInitialQuery = useRef(false);
  const [showFlightResults, setShowFlightResults] = useState(false);
  const [showViewFlightsButton, setShowViewFlightsButton] = useState(false);

  useEffect(() => {
    if (initialQuery && !processedInitialQuery.current) {
      handleSendMessage(initialQuery);
      processedInitialQuery.current = true;
    }
  }, [initialQuery]);

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || input;
    if (!content.trim()) return;

    setShowViewFlightsButton(false);
    let currentMessages = messages;
    if (!messageContent || !processedInitialQuery.current) {
      const userMessage: Message = { role: 'user', content };
      setMessages((prev) => [...prev, userMessage]);
      currentMessages = [...messages, userMessage];
    }
    
    if (!messageContent) {
      setInput('');
    }
    setLoading(true);

    try {
      const conversationHistory = currentMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
      
      let request: FlightBookingInput = {
        conversationHistory: conversationHistory,
      };
      
      let response = await flightBookingAssistant(request);
      
      if (response.isFlightDetailsComplete && response.flightDetails) {
        const { destination, origin, dates, passengers } = response.flightDetails;
        const queryParts = [];
        if (destination) queryParts.push(`to ${destination}`);
        if (origin) queryParts.push(`from ${origin}`);
        if (dates) queryParts.push(`on ${dates}`);
        if (passengers) queryParts.push(`for ${passengers} people`);
        
        const newFlightQuery = `Flights ${queryParts.join(' ')}`;
        setFlightQuery(newFlightQuery);

        // Second call to AI with flight data for analysis
        const analysisRequest: FlightBookingInput = {
            conversationHistory: `${conversationHistory}\nassistant: ${response.reply}`,
            availableFlights: mockFlights,
        };
        response = await flightBookingAssistant(analysisRequest);
        setShowViewFlightsButton(true);
      }

      const assistantMessage: Message = { role: 'assistant', content: response.reply };
      setMessages((prev) => [...prev, assistantMessage]);

    } catch (error) {
      const errorMessage: Message = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' };
      setMessages((prev) => [...prev, errorMessage]);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow p-4 border rounded-lg mb-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback><Bot size={20} /></AvatarFallback>
                </Avatar>
              )}
              <div className={`p-3 rounded-lg max-w-[75%] whitespace-pre-wrap ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {message.content}
              </div>
               {message.role === 'user' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback><User size={20} /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {loading && (
             <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback><Bot size={20} /></AvatarFallback>
                </Avatar>
                <div className="p-3 rounded-lg bg-muted">
                    <Loader2 className="h-5 w-5 animate-spin" />
                </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {showViewFlightsButton && (
          <div className="mb-4 text-center">
              <Button onClick={() => setShowFlightResults(!showFlightResults)}>
                {showFlightResults ? 'Hide Results' : 'View All Flights'}
              </Button>
          </div>
      )}

      {showFlightResults && flightQuery && (
        <div className="mt-6 border-t pt-6">
            <h2 className="text-2xl font-bold text-center mb-4">Available Flights</h2>
            <FlightResultsView query={flightQuery} />
        </div>
      )}


      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
          placeholder="e.g., I want to fly from SFO to JFK next week"
          disabled={loading}
        />
        <Button onClick={() => handleSendMessage()} disabled={loading}>
          Send
        </Button>
      </div>
    </div>
  );
}
