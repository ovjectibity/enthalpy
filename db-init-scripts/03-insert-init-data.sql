-- ==========================================
-- DUMMY DATA INSERTION SCRIPT
-- ==========================================

-- ==========================================
-- COMMON DATABASE DATA
-- ==========================================

\c enthalpy_production;

-- Insert dummy groups data
INSERT INTO common.groups (name, domain, industry, address) VALUES
('TechCorp Solutions', 'techcorp.com', 'Technology', '123 Silicon Valley Blvd, San Francisco, CA 94102'),
('Healthcare Innovations', 'healthinnovate.com', 'Healthcare', '456 Medical Center Dr, Boston, MA 02115'),
('FinanceFirst', 'financefirst.com', 'Financial Services', '789 Wall Street, New York, NY 10005'),
('EduTech Academy', 'edutech.edu', 'Education', '321 University Ave, Austin, TX 78712'),
('GreenEnergy Corp', 'greenenergy.com', 'Renewable Energy', '654 Sustainability Way, Portland, OR 97201'),
('RetailMax', 'retailmax.com', 'Retail', '987 Commerce Plaza, Chicago, IL 60601'),
('ManufacturingPro', 'manufpro.com', 'Manufacturing', '147 Industrial Park Dr, Detroit, MI 48201'),
('ConsultingExperts', 'consultexperts.com', 'Consulting', '258 Business Center, Seattle, WA 98101');

-- Insert dummy users data
INSERT INTO common.users (first_name, last_name, email, signedup_at, email_verified_at, org_role, group_id) VALUES
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
INSERT INTO common.account (user_id, password, login_type) VALUES
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

-- Insert dummy projects data
INSERT INTO assets.projects (user_id, description) VALUES
(1, 'Project Alpha: User Engagement Initiative'),
(1, 'Project Beta: Onboarding Flow Redesign'),
(2, 'Project Gamma: Churn Reduction Strategy'),
(3, 'Project Delta: Conversion Optimization');

-- Insert dummy objectives data
INSERT INTO assets.objectives (user_id, project_id, title, description) VALUES
(1, 1, 'Increase User Engagement', 'Improve daily active users by 25% through enhanced user experience and feature optimization'),
(2, 3, 'Reduce Customer Churn', 'Decrease monthly churn rate from 8% to 5% by improving onboarding and support'),
(3, 4, 'Optimize Conversion Funnel', 'Increase conversion rate from trial to paid subscription by 15%'),
(4, 1, 'Improve App Performance', 'Reduce app load time by 30% and crash rate by 50%'),
(5, 1, 'Expand Market Reach', 'Enter two new geographic markets and acquire 10,000 new users'),
(6, 1, 'Enhance Customer Satisfaction', 'Achieve Net Promoter Score of 8.0 or higher'),
(7, 2, 'Streamline User Onboarding', 'Reduce onboarding completion time by 40% while maintaining quality'),
(8, 1, 'Increase Revenue Per User', 'Improve average revenue per user (ARPU) by 20% through upselling');

-- Insert dummy metrics data
INSERT INTO assets.metrics (user_id, project_id, title, description, formula) VALUES
(1, 1, 'Daily Active Users', 'Number of unique users who engage with the platform daily', 'COUNT(DISTINCT user_id WHERE last_activity >= CURRENT_DATE)'),
(1, 1, 'Monthly Recurring Revenue', 'Predictable revenue generated from subscriptions each month', 'SUM(subscription_amount WHERE status = active)'),
(2, 3, 'Customer Acquisition Cost', 'Average cost to acquire a new paying customer', 'total_marketing_spend / new_customers_acquired'),
(3, 4, 'Lifetime Value', 'Predicted net profit from entire relationship with customer', 'average_revenue_per_month * average_customer_lifespan_months'),
(1, 2, 'Conversion Rate', 'Percentage of visitors who complete desired action', '(conversions / total_visitors) * 100'),
(4, 1, 'App Store Rating', 'Average user rating across all app stores', 'AVG(rating) FROM app_reviews WHERE review_date >= CURRENT_DATE - 30'),
(5, 1, 'Feature Adoption Rate', 'Percentage of users who use a specific feature', '(feature_users / total_active_users) * 100'),
(6, 1, 'Customer Satisfaction Score', 'Average satisfaction rating from customer surveys', 'AVG(satisfaction_rating) FROM customer_surveys');

-- Insert dummy hypotheses data
INSERT INTO assets.hypotheses (user_id, project_id, title, action, expected_outcome, rationale, user_target, linked_experiments, linked_context, linked_objectives, linked_metrics) VALUES
(1, 1, 'Simplified Onboarding Increases Retention',
 'Reduce onboarding steps from 8 to 4 and add progress indicators',
 'Day-7 retention rate will increase from 45% to 60%',
 'Shorter onboarding reduces friction and cognitive load, leading to higher completion rates',
 'New users in their first week',
 '{1,2}', '{1,4}', '{2,7}', '{1,5}'),

(1, 1, 'Push Notifications Boost Daily Engagement',
 'Send personalized push notifications based on user behavior patterns',
 'Daily active users will increase by 30% within 4 weeks',
 'Timely, relevant notifications can re-engage dormant users and encourage daily usage',
 'Users inactive for 2+ days',
 '{3}', '{8}', '{1}', '{1,7}'),

(2, 3, 'Premium Feature Preview Increases Conversions',
 'Show 3-day preview of premium features to free tier users',
 'Free-to-paid conversion rate will improve from 8% to 12%',
 'Experiencing premium value firsthand creates stronger motivation to upgrade than descriptions alone',
 'Free tier users active for 14+ days',
 '{4,5}', '{2}', '{3}', '{2,5}'),

(3, 4, 'Social Proof Reduces Signup Friction',
 'Add testimonials and user count display on landing page',
 'Signup conversion rate will increase from 3.2% to 4.5%',
 'Social validation reduces perceived risk and builds trust with potential users',
 'Landing page visitors',
 '{6}', '{3,7}', '{5}', '{5}'),

(1, 1, 'Gamification Improves Feature Adoption',
 'Implement achievement badges and progress tracking for key features',
 'Feature adoption rate will increase by 40% for targeted features',
 'Gamification elements tap into intrinsic motivation and make feature discovery more engaging',
 'Active users with low feature engagement',
 '{7,8}', '{6}', '{1}', '{7}');

-- Insert dummy experiments data
INSERT INTO assets.experiments (user_id, project_id, title, linked_hypotheses, plan, status) VALUES
(1, 1, 'A/B Test: Reduced Onboarding Steps',
 '{1}',
 'Split test with 50% users getting current 8-step onboarding, 50% getting new 4-step version. Track completion rates, day-7 retention, and user feedback over 4 weeks.',
 'running'),

(2, 3, 'Onboarding Progress Indicator Test',
 '{1}',
 'Test addition of visual progress bar and completion percentage. Measure impact on onboarding completion and user satisfaction scores.',
 'planning'),

(3, 4, 'Smart Push Notification Campaign',
 '{2}',
 'Implement ML-based notification timing and content personalization. A/B test against current generic notifications with 10,000 user cohorts.',
 'completed'),

(4, 1, 'Premium Preview Trial',
 '{3}',
 'Automatically grant 72-hour premium access to eligible free users. Track engagement with premium features and subsequent conversion rates.',
 'running'),

(5, 1, 'Conversion Funnel Optimization',
 '{3}',
 'Test streamlined payment flow with guest checkout option. Compare against current multi-step process.',
 'planning'),

(6, 1, 'Landing Page Social Proof Test',
 '{4}',
 'A/B test landing page with customer testimonials, logos, and live user counter vs control version. Track signup rates and user quality.',
 'completed'),

(7, 2, 'Achievement System Rollout',
 '{5}',
 'Phase 1: Implement basic badge system for 3 core features. Measure feature engagement before and after implementation.',
 'running'),

(8, 1, 'Progress Tracking Dashboard',
 '{5}',
 'Create user dashboard showing feature usage progress and achievements. Test impact on overall platform engagement.',
 'planning');

-- ==========================================
-- SUMMARY STATISTICS
-- ==========================================

-- Display summary of inserted data
SELECT 'COMMON DATABASE SUMMARY:' as info;
SELECT 'Groups: ' || COUNT(*) as count FROM common.groups;
SELECT 'Users: ' || COUNT(*) as count FROM common.users;
SELECT 'Accounts: ' || COUNT(*) as count FROM common.account;

SELECT 'ASSETS DATABASE SUMMARY:' as info;
SELECT 'Projects: ' || COUNT(*) as count FROM assets.projects;
SELECT 'Objectives: ' || COUNT(*) as count FROM assets.objectives;
SELECT 'Metrics: ' || COUNT(*) as count FROM assets.metrics;
SELECT 'Hypotheses: ' || COUNT(*) as count FROM assets.hypotheses;
SELECT 'Experiments: ' || COUNT(*) as count FROM assets.experiments;

SELECT 'Data insertion completed successfully!' as status;
