
"use client";

import { useEffect, useState, useMemo } from 'react';
import { parseFlightQuery, type ParseFlightQueryOutput } from '@/ai/flows/parse-flight-query';
import { type Flight } from '@/types';
import FlightCard from '@/components/flight-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Bell } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const mockFlights: Flight[] = [
    { id: '1', provider: 'Emirates', legs: [{ airline: 'Emirates', airlineLogoUrl: 'https://picsum.photos/40/40?random=1', departureTime: '14:35', arrivalTime: '08:05', duration: '13h 30m', stops: '1 stop DXB', fromCode: 'GLA', toCode: 'MAA' }, { airline: 'Emirates', airlineLogoUrl: 'https://picsum.photos/40/40?random=1', departureTime: '04:00', arrivalTime: '12:45', duration: '12h 15m', stops: '1 stop DXB', fromCode: 'MAA', toCode: 'GLA' }], price: 843, from: { code: 'GLA', time: '14:35', airport: 'Glasgow' }, to: { code: 'MAA', time: '08:05', airport: 'Chennai' }, duration: '13h 30m', stops: 1, stopDetails: '1 stop', emissions: { co2: 13, comparison: 'less' } },
    { id: '2', provider: 'Wizz Air', legs: [{ airline: 'Wizz Air', airlineLogoUrl: 'https://picsum.photos/40/40?random=2', departureTime: '06:55', arrivalTime: '03:30', duration: '16h 05m', stops: '1 stop LHR', fromCode: 'GLA', toCode: 'MAA' }, { airline: 'Wizz Air', airlineLogoUrl: 'https://picsum.photos/40/40?random=2', departureTime: '05:35', arrivalTime: '15:35', duration: '14h 30m', stops: '1 stop LHR', fromCode: 'MAA', toCode: 'GLA' }], price: 653, from: { code: 'GLA', time: '06:55', airport: 'Glasgow' }, to: { code: 'MAA', time: '03:30', airport: 'Chennai' }, duration: '16h 05m', stops: 1, stopDetails: '1 stop' },
    { id: '3', provider: 'Lufthansa', legs: [{ airline: 'Lufthansa', airlineLogoUrl: 'https://picsum.photos/40/40?random=3', departureTime: '06:10', arrivalTime: '00:10', duration: '13h 30m', stops: '1 stop FRA', fromCode: 'GLA', toCode: 'MAA' }, { airline: 'Lufthansa', airlineLogoUrl: 'https://picsum.photos/40/40?random=3', departureTime: '01:55', arrivalTime: '12:25', duration: '15h 00m', stops: '1 stop FRA', fromCode: 'MAA', toCode: 'GLA' }], price: 674, from: { code: 'GLA', time: '06:10', airport: 'Glasgow' }, to: { code: 'MAA', time: '00:10', airport: 'Chennai' }, duration: '13h 30m', stops: 1, stopDetails: '1 stop' },
    { id: '4', provider: 'British Airways', legs: [{ airline: 'British Airways', airlineLogoUrl: 'https://picsum.photos/40/40?random=4', departureTime: '09:15', arrivalTime: '04:45', duration: '15h 00m', stops: '1 stop LHR', fromCode: 'GLA', toCode: 'MAA' }, { airline: 'British Airways', airlineLogoUrl: 'https://picsum.photos/40/40?random=4', departureTime: '06:30', arrivalTime: '17:00', duration: '15h 00m', stops: '1 stop LHR', fromCode: 'MAA', toCode: 'GLA' }], price: 783, from: { code: 'GLA', time: '09:15', airport: 'Glasgow' }, to: { code: 'MAA', time: '04:45', airport: 'Chennai' }, duration: '13h 08m', stops: 1, stopDetails: '1 stop' },
    { id: '5', provider: 'KLM', legs: [{ airline: 'KLM', airlineLogoUrl: 'https://picsum.photos/40/40?random=5', departureTime: '11:20', arrivalTime: '07:50', duration: '15h 50m', stops: '1 stop AMS', fromCode: 'GLA', toCode: 'MAA' }, { airline: 'KLM', airlineLogoUrl: 'https://picsum.photos/40/40?random=5', departureTime: '09:45', arrivalTime: '20:00', duration: '14h 45m', stops: '1 stop AMS', fromCode: 'MAA', toCode: 'GLA' }], price: 628, from: { code: 'GLA', time: '11:20', airport: 'Glasgow' }, to: { code: 'MAA', time: '07:50', airport: 'Chennai' }, duration: '20h 08m', stops: 1, stopDetails: '1 stop' },
];

interface FlightResultsViewProps {
    query: string;
    layout?: 'list' | 'grid';
}

export default function FlightResultsView({ query, layout = 'list' }: FlightResultsViewProps) {
    const [parsedQuery, setParsedQuery] = useState<ParseFlightQueryOutput | null>(null);
    const [flights, setFlights] = useState<Flight[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sort, setSort] = useState('best');
    const [activeTab, setActiveTab] = useState('best');

    useEffect(() => {
        if (!query) {
            setLoading(false);
            return;
        }

        const fetchQueryAndFlights = async () => {
            setLoading(true);
            setError(null);
            setParsedQuery(null);
            setFlights([]);
            try {
                // In a real app, you'd fetch flights based on the parsed query
                const parsed = await parseFlightQuery({ query });
                setParsedQuery(parsed);
                setTimeout(() => {
                    setFlights(mockFlights);
                    setLoading(false);
                }, 1000);
            } catch (err) {
                setError('Failed to parse query or fetch flights. Please try again.');
                console.error(err);
                setLoading(false);
            }
        };

        fetchQueryAndFlights();
    }, [query]);
    
     const sortedFlights = useMemo(() => {
        const sorted = [...flights].sort((a, b) => {
            const durationA = (a.duration?.match(/(\d+)h\s*(\d*)m/)||[]).slice(1).map(s=>parseInt(s)||0).reduce((acc, val, i) => acc + val * (i === 0 ? 60 : 1), 0);
            const durationB = (b.duration?.match(/(\d+)h\s*(\d*)m/)||[]).slice(1).map(s=>parseInt(s)||0).reduce((acc, val, i) => acc + val * (i === 0 ? 60 : 1), 0);
            
            switch (activeTab) {
                case 'cheapest':
                    return a.price - b.price;
                case 'fastest':
                     return durationA - durationB;
                case 'best':
                default:
                    // A simple 'best' algorithm: combines price and duration
                    return (a.price / 2) + durationA - ((b.price / 2) + durationB);
            }
        });
        return sorted;
    }, [flights, activeTab]);

    const bestFlight = useMemo(() => {
        return [...flights].sort((a,b) => (a.price / 2) + (a.duration?.match(/(\d+)h\s*(\d*)m/)||[]).slice(1).map(s=>parseInt(s)||0).reduce((acc, val, i) => acc + val * (i === 0 ? 60 : 1), 0) - ((b.price / 2) + (b.duration?.match(/(\d+)h\s*(\d*)m/)||[]).slice(1).map(s=>parseInt(s)||0).reduce((acc, val, i) => acc + val * (i === 0 ? 60 : 1), 0)))[0]
    }, [flights]);

    const cheapestFlight = useMemo(() => [...flights].sort((a,b) => a.price - b.price)[0], [flights]);
    
    const fastestFlight = useMemo(() => {
        return [...flights].sort((a,b) => {
            const durationA = (a.duration?.match(/(\d+)h\s*(\d*)m/)||[]).slice(1).map(s=>parseInt(s)||0).reduce((acc, val, i) => acc + val * (i === 0 ? 60 : 1), 0);
            const durationB = (b.duration?.match(/(\d+)h\s*(\d*)m/)||[]).slice(1).map(s=>parseInt(s)||0).reduce((acc, val, i) => acc + val * (i === 0 ? 60 : 1), 0);
            return durationA - durationB;
        })[0];
    }, [flights]);


    if (loading) {
        return (
             <div className="space-y-4 p-4">
                 <div className="flex justify-between items-center mb-4">
                    <Skeleton className="h-9 w-40" />
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-9 w-32" />
                </div>
                 <Skeleton className="h-12 w-full mb-4" />
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-40 w-full rounded-lg" />
                ))}
            </div>
        );
    }
    
    if (error) {
        return <Alert variant="destructive" className="m-8 max-w-2xl mx-auto"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    }

    if (!query) {
         return <div className="text-center py-20">Please go back and enter a search query.</div>
    }
    
    const containerClasses = layout === 'grid' ? "p-0" : "container mx-auto max-w-7xl px-4 py-8";

    return (
        <div className={containerClasses}>
            {layout === 'grid' && (
                <div className="flex items-center justify-between mb-4">
                    <Button variant="outline"><Bell className="mr-2 h-4 w-4" /> Get Price Alerts</Button>
                    <p className="text-sm text-muted-foreground">47 of 536 results (<a href="#" className="underline">show all</a>)</p>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">Sort by: {sort.charAt(0).toUpperCase() + sort.slice(1)}</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
                                <DropdownMenuRadioItem value="best">Best</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="cheapest">Cheapest</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="fastest">Fastest</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
             {layout === 'grid' ? (
                 <div className="space-y-4">
                    <Tabs defaultValue="best" className="w-full" onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="best">
                                Best <span className="font-normal text-muted-foreground ml-2">£{bestFlight?.price}</span>
                                <span className="text-xs text-muted-foreground ml-2">{bestFlight?.duration}</span>
                            </TabsTrigger>
                             <TabsTrigger value="cheapest">
                                Cheapest <span className="font-normal text-muted-foreground ml-2">£{cheapestFlight?.price}</span>
                                <span className="text-xs text-muted-foreground ml-2">{cheapestFlight?.duration}</span>
                            </TabsTrigger>
                             <TabsTrigger value="fastest">
                                Fastest <span className="font-normal text-muted-foreground ml-2">£{fastestFlight?.price}</span>
                                 <span className="text-xs text-muted-foreground ml-2">{fastestFlight?.duration}</span>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                    {sortedFlights.map(flight => <FlightCard key={flight.id} flight={flight} layout="grid" />)}
                 </div>
            ) : (
                 <div className={cn(
                    "overflow-y-auto",
                    layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'
                )}>
                    {sortedFlights.length > 0 ? (
                        sortedFlights.map(flight => <FlightCard key={flight.id} flight={flight} layout={layout} />)
                    ) : (
                        <p>No flights found for your query.</p>
                    )}
                </div>
            )}
        </div>
    );
}
