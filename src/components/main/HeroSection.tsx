import { MapPin, Search, Calendar, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@mui/material";
import styled from "styled-components";
import Link from 'next/link';
import { useRef } from 'react';

export const HeroSection = () => {
  const featureSectionRef = useRef<HTMLDivElement>(null);

  const scrollToFeature = () => {
    featureSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Section>
      <BackgroundGradient>
        <RadialPattern />
      </BackgroundGradient>
      <Container>
        <ContentWrapper>
          <TextContent
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              여행의 새로운 패러다임
            </Badge>
            <Title
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              당신의 여행을
              <br />
              <Highlight>더 특별하게</Highlight>
            </Title>
            <Description
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              지도에서 실제 여행자들의 생생한 후기를 확인하고,
              <br />
              AI의 도움으로 스마트한 여행 계획을 세워보세요
            </Description>
            <ButtonContainer
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Link href="/map">
                <Button
                  variant="contained"
                  color="primary"
                  sx={{
                    width: "120px",
                    height: "45px",
                    fontSize: "16px",
                  }}
                >
                  시작하기
                </Button>
              </Link>
              <Button
                variant="outlined"
                color="primary"
                sx={{
                  width: "120px",
                  height: "45px",
                  fontSize: "16px",
                }}
                onClick={scrollToFeature}
              >
                더 알아보기
              </Button>
            </ButtonContainer>
          </TextContent>

          <IllustrationWrapper
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <IllustrationContainer>
              <FloatingCard
                animate={{
                  y: [0, 15, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              >
                <CardContent>
                  <CardGradient />
                  <IconContainer>
                    <CardImage src="/project.svg" alt="여행 이미지" />
                  </IconContainer>
                </CardContent>
              </FloatingCard>

              <FloatingElement
                initial={{ x: -10, y: -10 }}
                animate={{ x: 10, y: 10 }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                style={{ top: "-2.5rem", left: "-2.5rem" }}
              >
                <SearchIcon />
              </FloatingElement>

              <FloatingElement
                initial={{ x: 10, y: 10 }}
                animate={{ x: -10, y: -10 }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                style={{ bottom: "-2.5rem", right: "-2.5rem" }}
              >
                <MessageIcon />
              </FloatingElement>
            </IllustrationContainer>
          </IllustrationWrapper>
        </ContentWrapper>
      </Container>
      <div ref={featureSectionRef} />
    </Section>
  );
};


const Section = styled.section`
  min-height: 100vh;
  position: relative;
  overflow: hidden;
`;

const BackgroundGradient = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, #F5F8FF, white);
`;

const RadialPattern = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0.1;
  background: radial-gradient(circle 500px at 50% 200px, #E8F0FF, transparent);
`;

const Container = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 8rem 1rem 8rem;
  position: relative;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3rem;

  @media (min-width: 1024px) {
    flex-direction: row;
  }
`;

const TextContent = styled(motion.div)`
  flex: 1;
  text-align: center;
  max-width: 42rem;
  margin: 0 auto;

  @media (min-width: 1024px) {
    text-align: left;
    margin: 0;
  }
`;

const Badge = styled(motion.span)`
  display: inline-block;
  padding: 0.375rem 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  background-color: rgba(210, 224, 251, 0.3);
  color: #90a4c8;
  border-radius: 9999px;
`;

const Title = styled(motion.h1)`
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1.5rem;
  line-height: 1.2;

  @media (min-width: 768px) {
    font-size: 3.75rem;
  }
`;

const Highlight = styled.span`
  color:rgb(109, 141, 201);
`;

const Description = styled(motion.p)`
  font-size: 1.25rem;
  color: #4B5563;
  margin-bottom: 2rem;
`;

const ButtonContainer = styled(motion.div)`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;

  @media (min-width: 1024px) {
    justify-content: flex-start;
  }
`;

const IllustrationWrapper = styled(motion.div)`
  flex: 1;
  position: relative;
  min-width: 0;
  min-height: 200px;
  width: 100%;
`;

const IllustrationContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 32rem;
  margin: 0 auto;
  min-width: 0;
`;

const FloatingCard = styled(motion.div)`
  width: 100%;
  min-width: 0;
  height: 24rem;
  min-height: 200px;
  background-color: white;
  border-radius: 1.5rem;
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  padding: 1.5rem;
`;

const CardContent = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 1rem;
  overflow: hidden;
  background-color: #EFF6FF;
`;

const CardGradient = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom right, rgba(191, 219, 254, 0.5), transparent);
`;

const IconContainer = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CardImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 1rem;
`;

const FloatingElement = styled(motion.div)`
  position: absolute;
  padding: 1rem;
  background-color: white;
  border-radius: 1rem;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
`;

const SearchIcon = styled(Search)`
  width: 2rem;
  height: 2rem;
  color: rgb(109, 141, 201);
`;

const MessageIcon = styled(MessageSquare)`
  width: 2rem;
  height: 2rem;
  color: rgb(109, 141, 201);
`;
