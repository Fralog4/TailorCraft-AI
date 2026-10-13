from pydantic import BaseModel, Field
from typing import List, Optional

class Experience(BaseModel):
    job_title: str = Field(description="Job title or role")
    company: str = Field(description="Company or organization name")
    start_date: str = Field(description="Start date, e.g. 'Jan 2021'")
    end_date: str = Field(description="End date, e.g. 'Present' or 'Dec 2023'")
    bullet_points: List[str] = Field(description="Rewritten using action verbs and JD keywords")

class Education(BaseModel):
    degree: str = Field(description="Degree, diploma or certification")
    institution: str = Field(description="University, college or school")
    graduation_year: str = Field(description="Graduation year or date range")

class TailoredCV(BaseModel):
    full_name: str = Field(description="Full name of the candidate")
    contact_info: str = Field(description="Contact details, e.g. Email | Phone | Location | LinkedIn | GitHub")
    professional_summary: str = Field(description="3-4 sentences matching JD core requirements")
    skills: List[str] = Field(description="Top skills matching the JD, extracted from original CV")
    experiences: List[Experience] = Field(description="List of professional work experiences")
    education: List[Education] = Field(description="List of educational achievements")
