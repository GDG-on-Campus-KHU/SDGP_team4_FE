import { MapPin, Search, Calendar, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import styled from "styled-components";

const features = [
  {
    icon: MapPin,
    title: "지도 기반 후기",
    description: "실제 방문자들의 생생한 후기를 지도에서 바로 확인하세요",
  },
  {
    icon: Search,
    title: "스마트 검색",
    description: "원하는 장소를 쉽고 빠르게 찾아보세요",
  },
  {
    icon: Calendar,
    title: "여행 계획",
    description: "손쉽게 나만의 완벽한 여행 일정을 만들어보세요",
  },
  {
    icon: MessageSquare,
    title: "AI 후기 요약",
    description: "AI가 분석한 핵심 정보로 빠른 의사결정을 도와드립니다",
  },
];

export const FeatureSection = () => {
  return (
    <Section>
      <Container>
        <Header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Title>스마트한 여행의 시작</Title>
          <Subtitle>
            여행의 모든 순간을 더 특별하게 만들어주는 핵심 기능들을 만나보세요
          </Subtitle>
        </Header>

        <Grid>
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <IconWrapper>
                <FeatureIcon as={feature.icon} />
              </IconWrapper>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
            </FeatureCard>
          ))}
        </Grid>
      </Container>
    </Section>
  );
};


const Section = styled.section`
  padding: 6rem 0;
  background-color: white;
`;

const Container = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
`;

const Header = styled(motion.div)`
  text-align: center;
  margin-bottom: 4rem;
`;

const Title = styled.h2`
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1rem;

  @media (min-width: 768px) {
    font-size: 2.25rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: #4B5563;
  max-width: 42rem;
  margin: 0 auto;
`;

const Grid = styled.div`
  display: grid;
  gap: 2rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const FeatureCard = styled(motion.div)`
  padding: 1.5rem;
  background-color: white;
  border-radius: 0.75rem;
  border: 1px solid #F3F4F6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const IconWrapper = styled.div`
  margin-bottom: 1.5rem;
`;

const FeatureIcon = styled.div`
  width: 3rem;
  height: 3rem;
  color: rgb(109, 141, 201);
`;

const FeatureTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.75rem;
`;

const FeatureDescription = styled.p`
  color: #4B5563;
`;
