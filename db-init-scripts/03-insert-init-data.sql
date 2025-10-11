-- ==========================================
-- DUMMY DATA INSERTION SCRIPT
-- ==========================================

-- ==========================================
-- COMMON DATABASE DATA
-- ==========================================

\c common;

-- Insert dummy groups data
INSERT INTO groups (name, domain, industry, address) VALUES
('TechCorp Solutions', 'techcorp.com', 'Technology', '123 Silicon Valley Blvd, San Francisco, CA 94102'),
('Healthcare Innovations', 'healthinnovate.com', 'Healthcare', '456 Medical Center Dr, Boston, MA 02115'),
('FinanceFirst', 'financefirst.com', 'Financial Services', '789 Wall Street, New York, NY 10005'),
('EduTech Academy', 'edutech.edu', 'Education', '321 University Ave, Austin, TX 78712'),
('GreenEnergy Corp', 'greenenergy.com', 'Renewable Energy', '654 Sustainability Way, Portland, OR 97201'),
('RetailMax', 'retailmax.com', 'Retail', '987 Commerce Plaza, Chicago, IL 60601'),
('ManufacturingPro', 'manufpro.com', 'Manufacturing', '147 Industrial Park Dr, Detroit, MI 48201'),
('ConsultingExperts', 'consultexperts.com', 'Consulting', '258 Business Center, Seattle, WA 98101');

-- Insert dummy users data
INSERT INTO users (first_name, last_name, email, signedup_at, email_verified_at, org_role, group_id) VALUES
('John', 'Doe', 'john.doe@techcorp.com', NOW() - INTERVAL '30 days', NOW() - INTERVAL '29 days', 'Admin', 1),
('Jane', 'Smith', 'jane.smith@techcorp.com', NOW() - INTERVAL '25 days', NOW() - INTERVAL '24 days', 'Manager', 1),
('Mike', 'Johnson', 'mike.johnson@healthinnovate.com', NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days', 'Developer', 2),
('Sarah', 'Wilson', 'sarah.wilson@financefirst.com', NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days', 'Analyst', 3),
('David', 'Brown', 'david.brown@edutech.edu', NOW() - INTERVAL '12 days', NOW() - INTERVAL '11 days', 'Researcher', 4),
('Emily', 'Davis', 'emily.davis@greenenergy.com', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', 'Project Manager', 5),
('Chris', 'Miller', 'chris.miller@retailmax.com', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days', 'Operations', 6),
('Lisa', 'Anderson', 'lisa.anderson@manufpro.com', NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days', 'Quality Assurance', 7),
('Robert', 'Taylor', 'robert.taylor@consultexperts.com', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days', 'Consultant', 8),
('Jennifer', 'Thomas', 'jennifer.thomas@techcorp.com', NOW() - INTERVAL '3 days', NULL, 'Developer', 1),
('Mark', 'White', 'mark.white@healthinnovate.com', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', 'Data Scientist', 2),
('Amy', 'Harris', 'amy.harris@financefirst.com', NOW() - INTERVAL '1 day', NULL, 'Business Analyst', 3);

-- Insert dummy account data
INSERT INTO account (user_id, password, login_type) VALUES
('1', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8xqKqf9/Jy', 'email'),
('2', '$2b$12$5f8yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8xqKqf9/Jy3c', 'email'),
('3', '$2b$12$8c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8xqKqf9/Jy5g', 'google'),
('4', '$2b$12$2v3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8xqKqf9/J7', 'email'),
('5', '$2b$12$9c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8xqKqf9/Jy1m', 'github'),
('6', '$2b$12$4v3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8xqKqf9/J2', 'email'),
('7', '$2b$12$7c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8xqKqf9/Jy4k', 'linkedin'),
('8', '$2b$12$1v3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8xqKqf9/J9', 'email'),
('9', '$2b$12$6c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8xqKqf9/Jy8n', 'google'),
('10', '$2b$12$3v3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8xqKqf9/J5', 'email'),
('11', '$2b$12$5c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8xqKqf9/Jy7p', 'github'),
('12', '$2b$12$8v3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8xqKqf9/J6', 'email');

-- ==========================================
-- ASSETS DATABASE DATA
-- ==========================================

\c assets;

-- Insert dummy context data
INSERT INTO context (title, description, type) VALUES
('Mobile App Usage Trends', 'Analysis of user behavior patterns on mobile applications across different demographics', 'Market Research'),
('Customer Satisfaction Survey Results', 'Quarterly customer satisfaction metrics and feedback analysis', 'Survey Data'),
('Competitor Analysis Q4 2024', 'Comprehensive analysis of competitor strategies and market positioning', 'Competitive Intelligence'),
('User Journey Mapping', 'End-to-end user experience mapping for web and mobile platforms', 'UX Research'),
('Revenue Impact Analysis', 'Financial impact assessment of product changes and feature rollouts', 'Financial Analysis'),
('Technical Performance Metrics', 'System performance, uptime, and scalability measurements', 'Technical Metrics'),
('Market Segmentation Study', 'Customer segmentation based on behavior, demographics, and preferences', 'Market Research'),
('Product Usage Analytics', 'Detailed analytics on feature adoption and user engagement', 'Product Analytics');

-- Insert dummy objectives data
INSERT INTO objectives (title, description, user_id) VALUES
('Increase User Engagement', 'Improve daily active users by 25% through enhanced user experience and feature optimization', 1),
('Reduce Customer Churn', 'Decrease monthly churn rate from 8% to 5% by improving onboarding and support', 2),
('Optimize Conversion Funnel', 'Increase conversion rate from trial to paid subscription by 15%', 3),
('Improve App Performance', 'Reduce app load time by 30% and crash rate by 50%', 4),
('Expand Market Reach', 'Enter two new geographic markets and acquire 10,000 new users', 5),
('Enhance Customer Satisfaction', 'Achieve Net Promoter Score of 8.0 or higher', 6),
('Streamline User Onboarding', 'Reduce onboarding completion time by 40% while maintaining quality', 7),
('Increase Revenue Per User', 'Improve average revenue per user (ARPU) by 20% through upselling', 8);

-- Insert dummy metrics data
INSERT INTO metrics (title, description, formula) VALUES
('Daily Active Users', 'Number of unique users who engage with the platform daily', 'COUNT(DISTINCT user_id WHERE last_activity >= CURRENT_DATE)'),
('Monthly Recurring Revenue', 'Predictable revenue generated from subscriptions each month', 'SUM(subscription_amount WHERE status = active)'),
('Customer Acquisition Cost', 'Average cost to acquire a new paying customer', 'total_marketing_spend / new_customers_acquired'),
('Lifetime Value', 'Predicted net profit from entire relationship with customer', 'average_revenue_per_month * average_customer_lifespan_months'),
('Conversion Rate', 'Percentage of visitors who complete desired action', '(conversions / total_visitors) * 100'),
('App Store Rating', 'Average user rating across all app stores', 'AVG(rating) FROM app_reviews WHERE review_date >= CURRENT_DATE - 30'),
('Feature Adoption Rate', 'Percentage of users who use a specific feature', '(feature_users / total_active_users) * 100'),
('Customer Satisfaction Score', 'Average satisfaction rating from customer surveys', 'AVG(satisfaction_rating) FROM customer_surveys');

-- Insert dummy hypotheses data
INSERT INTO hypotheses (title, action, expected_outcome, rationale, user_target, linked_experiments, linked_context, linked_objectives, linked_metrics) VALUES
('Simplified Onboarding Increases Retention',
 'Reduce onboarding steps from 8 to 4 and add progress indicators',
 'Day-7 retention rate will increase from 45% to 60%',
 'Shorter onboarding reduces friction and cognitive load, leading to higher completion rates',
 'New users in their first week',
 '{1,2}', '{1,4}', '{2,7}', '{1,5}'),

('Push Notifications Boost Daily Engagement',
 'Send personalized push notifications based on user behavior patterns',
 'Daily active users will increase by 30% within 4 weeks',
 'Timely, relevant notifications can re-engage dormant users and encourage daily usage',
 'Users inactive for 2+ days',
 '{3}', '{8}', '{1}', '{1,7}'),

('Premium Feature Preview Increases Conversions',
 'Show 3-day preview of premium features to free tier users',
 'Free-to-paid conversion rate will improve from 8% to 12%',
 'Experiencing premium value firsthand creates stronger motivation to upgrade than descriptions alone',
 'Free tier users active for 14+ days',
 '{4,5}', '{2}', '{3}', '{2,5}'),

('Social Proof Reduces Signup Friction',
 'Add testimonials and user count display on landing page',
 'Signup conversion rate will increase from 3.2% to 4.5%',
 'Social validation reduces perceived risk and builds trust with potential users',
 'Landing page visitors',
 '{6}', '{3,7}', '{5}', '{5}'),

('Gamification Improves Feature Adoption',
 'Implement achievement badges and progress tracking for key features',
 'Feature adoption rate will increase by 40% for targeted features',
 'Gamification elements tap into intrinsic motivation and make feature discovery more engaging',
 'Active users with low feature engagement',
 '{7,8}', '{6}', '{1}', '{7}');

-- Insert dummy experiments data
INSERT INTO experiments (title, linked_hypotheses, plan, status, user_id) VALUES
('A/B Test: Reduced Onboarding Steps',
 '{1}',
 'Split test with 50% users getting current 8-step onboarding, 50% getting new 4-step version. Track completion rates, day-7 retention, and user feedback over 4 weeks.',
 'running', 1),

('Onboarding Progress Indicator Test',
 '{1}',
 'Test addition of visual progress bar and completion percentage. Measure impact on onboarding completion and user satisfaction scores.',
 'planning', 2),

('Smart Push Notification Campaign',
 '{2}',
 'Implement ML-based notification timing and content personalization. A/B test against current generic notifications with 10,000 user cohorts.',
 'completed', 3),

('Premium Preview Trial',
 '{3}',
 'Automatically grant 72-hour premium access to eligible free users. Track engagement with premium features and subsequent conversion rates.',
 'running', 4),

('Conversion Funnel Optimization',
 '{3}',
 'Test streamlined payment flow with guest checkout option. Compare against current multi-step process.',
 'planning', 5),

('Landing Page Social Proof Test',
 '{4}',
 'A/B test landing page with customer testimonials, logos, and live user counter vs control version. Track signup rates and user quality.',
 'completed', 6),

('Achievement System Rollout',
 '{5}',
 'Phase 1: Implement basic badge system for 3 core features. Measure feature engagement before and after implementation.',
 'running', 7),

('Progress Tracking Dashboard',
 '{5}',
 'Create user dashboard showing feature usage progress and achievements. Test impact on overall platform engagement.',
 'planning', 8);

-- Insert dummy threads data
INSERT INTO threads (user_id, agent_type, chat_id) VALUES
(1, 'experiment_analyst', 1001),
(1, 'hypothesis_generator', 1002),
(2, 'data_insights', 1003),
(3, 'conversion_optimizer', 1004),
(4, 'performance_analyzer', 1005),
(2, 'user_research', 1006),
(5, 'market_intelligence', 1007),
(6, 'satisfaction_tracker', 1008),
(7, 'onboarding_specialist', 1009),
(8, 'revenue_optimizer', 1010),
(1, 'experiment_analyst', 1011),
(3, 'ab_test_manager', 1012);

-- ==========================================
-- SUMMARY STATISTICS
-- ==========================================

-- Display summary of inserted data
\c common;
SELECT 'COMMON DATABASE SUMMARY:' as info;
SELECT 'Groups: ' || COUNT(*) as count FROM groups;
SELECT 'Users: ' || COUNT(*) as count FROM users;
SELECT 'Accounts: ' || COUNT(*) as count FROM account;

\c assets;
SELECT 'ASSETS DATABASE SUMMARY:' as info;
SELECT 'Context: ' || COUNT(*) as count FROM context;
SELECT 'Objectives: ' || COUNT(*) as count FROM objectives;
SELECT 'Metrics: ' || COUNT(*) as count FROM metrics;
SELECT 'Hypotheses: ' || COUNT(*) as count FROM hypotheses;
SELECT 'Experiments: ' || COUNT(*) as count FROM experiments;
SELECT 'Threads: ' || COUNT(*) as count FROM threads;

SELECT 'Data insertion completed successfully!' as status;
