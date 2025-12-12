"use client";

import React, { useEffect, useState } from 'react';
import { Box, Text, SimpleGrid, Container } from '@mantine/core';
import { Header } from '@/components/layout/header';
// import { Sidebar } from '@/components/profile/Sidebar';
import { ExperienceCard } from '@/components/profile/ExperienceCard';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function Page() {
  const [experiences, setExperiences] = useState([
    {
      id: '1',
      title: 'Snorkeling Safari – Nusa Penida',
      duration: 'Full Day',
      price: 'Rp 650.000',
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
    },
    {
      id: '2',
      title: 'Sunset Dinner Cruise',
      duration: '3 Hours',
      price: 'Rp 850.000',
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
    },
    {
      id: '3',
      title: 'Private Island Hopping Tour',
      duration: 'Full Day',
      price: 'Rp 1.500.000',
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    },
  ]);

  const handleBook = (id: string) => {
    console.log('Booking experience:', id);
  };

  const handleRemove = (id: string) => {
    setExperiences((prev) => prev.filter((exp) => exp.id !== id));
  };

  const router = useRouter();
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login?redirectTo=/profile/wishlist');
      }
    };
    check();
  }, []);

  return (
    <Box style={{ width: '100%', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <Header />
      <Box component="main">
        <Container size="xl" py="xl">
          <Text style={{ fontSize: 30, fontWeight: 700, color: '#284361', marginBottom: 8 }}>
            Wishlist
          </Text>
          <Text style={{ color: '#6b7280', marginBottom: 32 }}>
            Your favorite experiences, saved for later.
          </Text>

          <SimpleGrid
            cols={{ base: 1, md: 2, lg: 3 }}
            spacing={24}
          >
            {experiences.map((experience) => (
              <ExperienceCard
                key={experience.id}
                title={experience.title}
                duration={experience.duration}
                price={experience.price}
                image={experience.image}
                onBook={() => handleBook(experience.id)}
                onRemove={() => handleRemove(experience.id)}
              />
            ))}
          </SimpleGrid>
        </Container>
      </Box>
    </Box>
  );
}
