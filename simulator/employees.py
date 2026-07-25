EMPLOYEES = [
    # Engineering (10 employees)
    {
        "user_id": "eng_01", "username": "alex.chen", "full_name": "Alex Chen",
        "department": "Engineering", "role": "Senior Engineer",
        "work_hours_mean": 9.5, "work_hours_std": 0.75,
        "resources": ["git.internal/repo1", "git.internal/repo2", "k8s-cluster", "jira.internal", "s3://eng-builds", "share://eng-docs", "ci-pipeline", "staging-env", "monitoring-dashboard"],
        "file_ops_mean": 150, "file_ops_std": 40,
        "base_ip": "10.100.10.101", "device_id": "DEV-MAC-E01"
    },
    {
        "user_id": "eng_02", "username": "priya.patel", "full_name": "Priya Patel",
        "department": "Engineering", "role": "DevOps Lead",
        "work_hours_mean": 9.5, "work_hours_std": 0.75,
        "resources": ["git.internal/repo1", "k8s-cluster", "jira.internal", "s3://eng-builds", "share://eng-docs", "ci-pipeline", "staging-env", "monitoring-dashboard"],
        "file_ops_mean": 150, "file_ops_std": 40,
        "base_ip": "10.100.10.102", "device_id": "DEV-MAC-E02"
    },
    {
        "user_id": "eng_03", "username": "marcus.vance", "full_name": "Marcus Vance",
        "department": "Engineering", "role": "QA Engineer",
        "work_hours_mean": 9.5, "work_hours_std": 0.75,
        "resources": ["git.internal/repo1", "k8s-cluster", "jira.internal", "s3://eng-builds", "share://eng-docs", "ci-pipeline", "staging-env", "monitoring-dashboard"],
        "file_ops_mean": 150, "file_ops_std": 40,
        "base_ip": "10.100.10.103", "device_id": "DEV-MAC-E03"
    },
    {
        "user_id": "eng_04", "username": "lisa.wong", "full_name": "Lisa Wong",
        "department": "Engineering", "role": "Tech Lead",
        "work_hours_mean": 9.5, "work_hours_std": 0.75,
        "resources": ["git.internal/repo1", "k8s-cluster", "jira.internal", "s3://eng-builds", "share://eng-docs", "ci-pipeline", "staging-env", "monitoring-dashboard"],
        "file_ops_mean": 150, "file_ops_std": 40,
        "base_ip": "10.100.10.104", "device_id": "DEV-MAC-E04"
    },
    {
        "user_id": "eng_05", "username": "jake.torres", "full_name": "Jake Torres",
        "department": "Engineering", "role": "Backend Dev",
        "work_hours_mean": 9.5, "work_hours_std": 0.75,
        "resources": ["git.internal/repo1", "k8s-cluster", "jira.internal", "s3://eng-builds", "share://eng-docs", "ci-pipeline", "staging-env", "monitoring-dashboard"],
        "file_ops_mean": 150, "file_ops_std": 40,
        "base_ip": "10.100.10.105", "device_id": "DEV-MAC-E05"
    },
    {
        "user_id": "eng_06", "username": "nadia.kowalski", "full_name": "Nadia Kowalski",
        "department": "Engineering", "role": "Frontend Dev",
        "work_hours_mean": 9.5, "work_hours_std": 0.75,
        "resources": ["git.internal/repo1", "k8s-cluster", "jira.internal", "s3://eng-builds", "share://eng-docs", "ci-pipeline", "staging-env", "monitoring-dashboard"],
        "file_ops_mean": 150, "file_ops_std": 40,
        "base_ip": "10.100.10.106", "device_id": "DEV-MAC-E06"
    },
    {
        "user_id": "eng_07", "username": "ryan.hughes", "full_name": "Ryan Hughes",
        "department": "Engineering", "role": "SRE",
        "work_hours_mean": 9.5, "work_hours_std": 0.75,
        "resources": ["git.internal/repo1", "k8s-cluster", "jira.internal", "s3://eng-builds", "share://eng-docs", "ci-pipeline", "staging-env", "monitoring-dashboard"],
        "file_ops_mean": 150, "file_ops_std": 40,
        "base_ip": "10.100.10.107", "device_id": "DEV-MAC-E07"
    },
    {
        "user_id": "eng_08", "username": "mei.tanaka", "full_name": "Mei Tanaka",
        "department": "Engineering", "role": "ML Engineer",
        "work_hours_mean": 9.5, "work_hours_std": 0.75,
        "resources": ["git.internal/repo1", "k8s-cluster", "jira.internal", "s3://eng-builds", "share://eng-docs", "ci-pipeline", "staging-env", "monitoring-dashboard"],
        "file_ops_mean": 150, "file_ops_std": 40,
        "base_ip": "10.100.10.108", "device_id": "DEV-MAC-E08"
    },
    {
        "user_id": "eng_09", "username": "carlos.mendez", "full_name": "Carlos Mendez",
        "department": "Engineering", "role": "Platform Engineer",
        "work_hours_mean": 9.5, "work_hours_std": 0.75,
        "resources": ["git.internal/repo1", "k8s-cluster", "jira.internal", "s3://eng-builds", "share://eng-docs", "ci-pipeline", "staging-env", "monitoring-dashboard"],
        "file_ops_mean": 150, "file_ops_std": 40,
        "base_ip": "10.100.10.109", "device_id": "DEV-MAC-E09"
    },
    {
        "user_id": "eng_10", "username": "olivia.brooks", "full_name": "Olivia Brooks",
        "department": "Engineering", "role": "Architect",
        "work_hours_mean": 9.5, "work_hours_std": 0.75,
        "resources": ["git.internal/repo1", "k8s-cluster", "jira.internal", "s3://eng-builds", "share://eng-docs", "ci-pipeline", "staging-env", "monitoring-dashboard"],
        "file_ops_mean": 150, "file_ops_std": 40,
        "base_ip": "10.100.10.110", "device_id": "DEV-MAC-E10"
    },
    
    # HR (5 employees)
    {
        "user_id": "hr_01", "username": "sarah.jenkins", "full_name": "Sarah Jenkins",
        "department": "HR", "role": "HR Director",
        "work_hours_mean": 8.5, "work_hours_std": 0.33,
        "resources": ["hris.internal", "bamboo-hr", "share://hr-payroll", "recruiting-portal", "benefits-portal"],
        "file_ops_mean": 45, "file_ops_std": 15,
        "base_ip": "10.100.20.101", "device_id": "DEV-WIN-H01"
    },
    {
        "user_id": "hr_02", "username": "david.miller", "full_name": "David Miller",
        "department": "HR", "role": "HRBP",
        "work_hours_mean": 8.5, "work_hours_std": 0.33,
        "resources": ["hris.internal", "bamboo-hr", "share://hr-payroll", "recruiting-portal", "benefits-portal"],
        "file_ops_mean": 45, "file_ops_std": 15,
        "base_ip": "10.100.20.102", "device_id": "DEV-WIN-H02"
    },
    {
        "user_id": "hr_03", "username": "rachel.adams", "full_name": "Rachel Adams",
        "department": "HR", "role": "Recruiter",
        "work_hours_mean": 8.5, "work_hours_std": 0.33,
        "resources": ["hris.internal", "bamboo-hr", "share://hr-payroll", "recruiting-portal", "benefits-portal"],
        "file_ops_mean": 45, "file_ops_std": 15,
        "base_ip": "10.100.20.103", "device_id": "DEV-WIN-H03"
    },
    {
        "user_id": "hr_04", "username": "tom.wilson", "full_name": "Tom Wilson",
        "department": "HR", "role": "Payroll Specialist",
        "work_hours_mean": 8.5, "work_hours_std": 0.33,
        "resources": ["hris.internal", "bamboo-hr", "share://hr-payroll", "recruiting-portal", "benefits-portal"],
        "file_ops_mean": 45, "file_ops_std": 15,
        "base_ip": "10.100.20.104", "device_id": "DEV-WIN-H04"
    },
    {
        "user_id": "hr_05", "username": "amy.foster", "full_name": "Amy Foster",
        "department": "HR", "role": "HR Coordinator",
        "work_hours_mean": 8.5, "work_hours_std": 0.33,
        "resources": ["hris.internal", "bamboo-hr", "share://hr-payroll", "recruiting-portal", "benefits-portal"],
        "file_ops_mean": 45, "file_ops_std": 15,
        "base_ip": "10.100.20.105", "device_id": "DEV-WIN-H05"
    },
    
    # Finance (5 employees)
    {
        "user_id": "fin_01", "username": "elena.rostova", "full_name": "Elena Rostova",
        "department": "Finance", "role": "Financial Controller",
        "work_hours_mean": 8.0, "work_hours_std": 0.25,
        "resources": ["erp-finance.internal", "share://finance-quarterly", "tax-portal", "banking-gateway", "audit-system"],
        "file_ops_mean": 80, "file_ops_std": 25,
        "base_ip": "10.100.30.101", "device_id": "DEV-WIN-F01"
    },
    {
        "user_id": "fin_02", "username": "robert.taylor", "full_name": "Robert Taylor",
        "department": "Finance", "role": "Senior Analyst",
        "work_hours_mean": 8.0, "work_hours_std": 0.25,
        "resources": ["erp-finance.internal", "share://finance-quarterly", "tax-portal", "banking-gateway", "audit-system"],
        "file_ops_mean": 80, "file_ops_std": 25,
        "base_ip": "10.100.30.102", "device_id": "DEV-WIN-F02"
    },
    {
        "user_id": "fin_03", "username": "jessica.park", "full_name": "Jessica Park",
        "department": "Finance", "role": "Accountant",
        "work_hours_mean": 8.0, "work_hours_std": 0.25,
        "resources": ["erp-finance.internal", "share://finance-quarterly", "tax-portal", "banking-gateway", "audit-system"],
        "file_ops_mean": 80, "file_ops_std": 25,
        "base_ip": "10.100.30.103", "device_id": "DEV-WIN-F03"
    },
    {
        "user_id": "fin_04", "username": "michael.chen", "full_name": "Michael Chen",
        "department": "Finance", "role": "Tax Specialist",
        "work_hours_mean": 8.0, "work_hours_std": 0.25,
        "resources": ["erp-finance.internal", "share://finance-quarterly", "tax-portal", "banking-gateway", "audit-system"],
        "file_ops_mean": 80, "file_ops_std": 25,
        "base_ip": "10.100.30.104", "device_id": "DEV-WIN-F04"
    },
    {
        "user_id": "fin_05", "username": "diana.okafor", "full_name": "Diana Okafor",
        "department": "Finance", "role": "Treasury Analyst",
        "work_hours_mean": 8.0, "work_hours_std": 0.25,
        "resources": ["erp-finance.internal", "share://finance-quarterly", "tax-portal", "banking-gateway", "audit-system"],
        "file_ops_mean": 80, "file_ops_std": 25,
        "base_ip": "10.100.30.105", "device_id": "DEV-WIN-F05"
    }
]

EMPLOYEES_BY_ID = {emp["user_id"]: emp for emp in EMPLOYEES}
