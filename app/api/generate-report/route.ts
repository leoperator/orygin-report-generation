import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import * as cheerio from 'cheerio';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// --- Helper Functions ---

async function scrapeWebsiteText(url: string): Promise<string> {
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!response.ok) {
      console.warn(`Failed to fetch ${url}, status: ${response.status}`);
      return 'Could not access the website. Relying on user-provided details.';
    }
    const html = await response.text();
    const $ = cheerio.load(html);

    $('script, style, nav, footer, header, aside, form').remove();
    let textContent = '';
    $('h1, h2, h3, p, title, meta[name="description"]').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text) textContent += text + '\n';
    });

    const cleanedText = textContent.replace(/\s\s+/g, ' ').trim();
    return cleanedText.substring(0, 4000);
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return 'Could not access the website. Relying on user-provided details.';
  }
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
    const words = text.split(' ');
    let lines: string[] = [];
    let currentLine = words[0] || '';
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = font.widthOfTextAtSize(currentLine + " " + word, fontSize);
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}


// --- Main API Handler ---

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, website, businessDetails, targetAudience } = body;

    if (!name || !email || !website || !businessDetails || !targetAudience) {
      return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
    }

    // Save lead to Firestore Database
    try {
      const leadData = {
        name,
        email,
        website,
        businessDetails,
        targetAudience,
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, "leads"), leadData);
      console.log("Lead saved to Firestore with ID: ", docRef.id);
    } catch (dbError) {
      console.error("Error saving to Firestore:", dbError);
    }

    const scrapedText = await scrapeWebsiteText(website);

    const prompt = `
      You are a world-class Tier-1 Management Consultant and Market Analyst working for Orygin.ai.
      A potential client, ${name}, from ${website} has requested a deeply comprehensive, data-driven business analysis. Your task is to generate an exhaustive, insightful, and highly actionable business growth report that is at least 2500 words long. This report should be the most valuable free resource they have ever received.

      **CLIENT-PROVIDED INFORMATION:**
      - Business Details: "${businessDetails}"
      - Target Audience: "${targetAudience}"

      **AUTOMATICALLY SCRAPED WEBSITE CONTENT (for context):**
      ---
      ${scrapedText}
      ---

      **MANDATORY INSTRUCTIONS:**
      Generate an extremely detailed report in Markdown format. The total length MUST be between 2500 and 3000 words. Address the client directly as ${name}. You MUST include all of the following sections and subsections, and you MUST elaborate extensively on each point.

      # Comprehensive Strategic Growth Blueprint for ${name}

      ## 1. Executive Summary & Strategic Overview
      (Approx. 300 words)
      - Start with a powerful, personalized summary of the business's current market position.
      - Synthesize information from their website and business details to identify their core value proposition.
      - Provide a high-level strategic thesis for their growth.
      - Conclude with a bulleted list of the 3 primary growth levers you will detail in this report.

      ## 2. In-Depth Market & Audience Analysis
      (Approx. 500 words)
      - **2.1. Target Audience Persona Development:** Based on their stated target audience, create a detailed customer persona. Include demographics, psychographics, pain points, goals, and online behavior. Give the persona a name.
      - **2.2. Market Trends & Industry Tailwinds:** Research and describe 2-3 current market trends relevant to their industry (e.g., "The rise of AI in small business automation," "Post-pandemic shifts in B2B marketing"). Explain how these trends represent opportunities.
      - **2.3. Inferred Competitive Landscape:** Based on their business, infer 2-3 likely direct or indirect competitors. Briefly analyze their apparent strengths and weaknesses. Identify a clear "gap in the market" that ${name}'s business can exploit.

      ## 3. Deep-Dive Analysis of Core Growth Levers
      (Approx. 800 words - This is the most important section)
      - For each of the 3 growth levers identified in the summary, create a detailed subsection.
      - **3.1. Growth Lever 1: [Name of Lever, e.g., Digital Presence & SEO Dominance]:**
          - **Current State Analysis:** Critique their current state based on the scraped website data. Be specific.
          - **Strategic Imperative:** Explain in detail WHY this is a critical area for them to focus on.
          - **Actionable Recommendations:** Provide a list of at least 5 highly specific, actionable recommendations. (e.g., "Implement a content cluster strategy around the keyword 'small business IT solutions in Guam'").
      - **3.2. Growth Lever 2: [Name of Lever, e.g., Conversion Rate Optimization & Lead Capture]:** (Repeat the detailed structure above)
      - **3.3. Growth Lever 3: [Name of Lever, e.g., Client Retention & Upsell Pathways]:** (Repeat the detailed structure above)

      ## 4. The Orygin.ai Strategic Partnership: Your Unfair Advantage
      (Approx. 500 words)
      - Directly and explicitly connect Orygin.ai's services to the solutions proposed in Section 3.
      - **4.1. Accelerating [Growth Lever 1] with Orygin.ai:** Explain HOW your specific AI tools solve their problems faster, cheaper, or more effectively than any manual approach. Use metrics and specific feature callouts.
      - **4.2. Systematizing [Growth Lever 2] with Orygin.ai:** (Repeat the detailed structure above)
      - **4.3. Automating [Growth Lever 3] with Orygin.ai:** (Repeat the detailed structure above)

      ## 5. Your 12-Month High-Growth Roadmap
      (Approx. 400 words)
      - Provide a detailed, phased implementation plan.
      - **Phase 1 (Months 1-3): Foundational Excellence.** (e.g., Full website SEO audit, AI-assisted content strategy development, CRM integration). List key deliverables for this phase.
      - **Phase 2 (Months 4-9): Aggressive Growth & Scaling.** (e.g., Launching multiple AI-powered marketing campaigns, implementing automated lead nurturing sequences). List key deliverables for this phase.
      - **Phase 3 (Months 10-12): Optimization & Market Leadership.** (e.g., Analyzing campaign data with AI to double down on winners, exploring new service offerings). List key deliverables for this phase.
      - **Your Immediate First Step:** The very first step in this entire plan MUST be to schedule a no-obligation strategy call with the Orygin.ai team to get this roadmap in motion.

      Maintain a highly professional, data-driven, and authoritative tone throughout.
    `;

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

    const apiResponse = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
        }),
    });

    if (!apiResponse.ok) {
        const errorBody = await apiResponse.json();
        console.error("Gemini API Error:", errorBody);
        throw new Error(`Gemini API request failed with status ${apiResponse.status}`);
    }

    const result = await apiResponse.json();
    const reportContent = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reportContent) {
      throw new Error('Failed to generate report content from Gemini.');
    }

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let y = height - 50;

    const lines = reportContent.split('\n');
    for (const line of lines) {
        if (y < 50) {
            page = pdfDoc.addPage();
            y = height - 50;
        }

        let currentFont = font;
        let fontSize = 10;
        let text = line;
        let leftMargin = 50;

        if (line.startsWith('# ')) {
            currentFont = boldFont;
            fontSize = 18;
            text = line.substring(2);
            y -= 20;
        } else if (line.startsWith('## ')) {
            currentFont = boldFont;
            fontSize = 14;
            text = line.substring(3);
            y -= 15;
        } else if (line.trim() === '') {
            y -= 10;
            continue;
        }
        
        const wrappedLines = wrapText(text, currentFont, fontSize, width - 100);
        for(const wrappedLine of wrappedLines) {
             if (y < 50) { page = pdfDoc.addPage(); y = height - 50; }
             page.drawText(wrappedLine, { x: leftMargin, y, font: currentFont, size: fontSize, color: rgb(0.1, 0.1, 0.1) });
             y -= (fontSize * 1.5);
        }
    }

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="OryginAI_Business_Report_for_${name.replace(/\s/g, '_')}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ message: 'An internal server error occurred.', error: error.message }, { status: 500 });
  }
}
