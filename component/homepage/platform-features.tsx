import React from 'react';
import { 
  Box, 
  Container, 
  Title, 
  Text, 
  Grid, 
  GridCol,
  Card, 
  CardSection,
  Image, 
  Button, 
  Group, 
  Stack
} from '@mantine/core';
import { 
  IconShip, 
  IconMap, 
  IconSwimming, 
  IconUmbrella, 
  IconArrowRight 
} from '@tabler/icons-react';
import classes from './platform-features.module.css';

const features = [
  {
    id: 1,
    title: 'Fastboat Services',
    description: 'Fast and comfortable journeys to and from surrounding islands.',
    details: 'Our modern Fastboat fleet offers safe and comfortable journeys to Nusa Penida, Gili Islands, and Lombok.',
    price: 'From Rp 100,000',
    icon: IconShip,
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80'
  },
  {
    id: 2,
    title: 'Tour Packages',
    description: "Discover the beauty of Bali and Gili's hidden islands.",
    details: 'Explore exotic spots with our guided tours — from Nusa Penida cliffs to hidden temples and waterfalls.',
    price: 'From Rp 300,000',
    icon: IconMap,
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80'
  },
  {
    id: 3,
    title: 'Watersport Adventures',
    description: 'Dive into fun, thrilling aquatic activities.',
    details: 'Experience jet skiing, banana boat rides, parasailing, snorkeling, and more — all with expert supervision.',
    price: 'From Rp 250,000',
    icon: IconSwimming,
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80'
  },
  {
    id: 4,
    title: 'Beach Club Access',
    description: "Relax in style at Bali's premium beach clubs.",
    details: "Enjoy exclusive access to beachfront pools, restaurants, and entertainment at Bali's most luxurious beach clubs.",
    price: 'From Rp 450,000',
    icon: IconUmbrella,
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80'
  }
];

export function PlatformFeatures() {
  return (
    <Box style={{ backgroundColor: '#f8f9fa', padding: '8px 0' }}>
      <Container size="xl">
        <Stack align="center" gap="xl" mb="xl">
          <Title 
            order={2} 
            ta="center" 
            size="xl"
            fw={700}
            c="#284361"
          >
            Why Choose Our Platform?
          </Title>
          <Text 
            size="lg"
            ta="center" 
            c="dimmed" 
            maw={600}
          >
            We provide comprehensive travel services that are fast, 
            reliable, safe, and unforgettable.
          </Text>
        </Stack>
        
        <Grid>
          {features.map((feature) => {
            // Use static icon mapping to avoid dynamic component issues
            let IconComponent;
            switch(feature.id) {
              case 1: IconComponent = IconShip; break;
              case 2: IconComponent = IconMap; break;
              case 3: IconComponent = IconSwimming; break;
              case 4: IconComponent = IconUmbrella; break;
              default: IconComponent = IconShip;
            }
            return (
              <GridCol key={feature.id} span={{ base: 6, md: 6, lg: 3 }}>
                <Card 
                  shadow="md" 
                  radius="xl" 
                  className={classes.featureCard}
                  bg="white"
                  style={{
                    height: '100%',
                    cursor: 'pointer'
                  }}
                >
                  <CardSection style={{ position: 'relative', height: '192px' }}>
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      h={192}
                      style={{ objectFit: 'cover' }}
                    />
                    <Box
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, transparent 0%, rgba(40, 67, 97, 0.9) 100%)',
                        display: 'flex',
                        alignItems: 'flex-end',
                        padding: '16px'
                      }}
                    >
                      <Stack gap="xs">
                        {IconComponent && <IconComponent size={32} color="white" />}
                        <Title order={3} c="white" size="lg" fw={700}>
                          {feature.title}
                        </Title>
                        <Text size="sm" c="rgba(255, 255, 255, 0.8)">
                          {feature.description}
                        </Text>
                      </Stack>
                    </Box>
                  </CardSection>
                  
                  <Stack p="md" justify="space-between" style={{ flexGrow: 1 }}>
                    <Text size="sm" c="dimmed" mb="md">
                      {feature.details}
                    </Text>
                    
                    <Group justify="space-between" align="center">
                      <Text fw={700} c="#284361" size="lg">
                        {feature.price}
                      </Text>
                      <Button
                        rightSection={<IconArrowRight size={16} />}
                        color="#284361"
                        styles={{
                          root: {
                            '&:hover': {
                              backgroundColor: '#1e3149'
                            }
                          }
                        }}
                      >
                        Book Now
                      </Button>
                    </Group>
                  </Stack>
                </Card>
              </GridCol>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
}