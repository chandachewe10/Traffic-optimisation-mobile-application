"""
Script to convert README.md to PowerPoint presentation
Requires: pip install python-pptx
"""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor

def create_presentation():
    """Create PowerPoint presentation from README content"""
    
    prs = Presentation()
    prs.slide_width = Inches(10)
    prs.slide_height = Inches(7.5)
    
    # Define colors
    PRIMARY_COLOR = RGBColor(33, 150, 243)  # Blue
    SECONDARY_COLOR = RGBColor(76, 175, 80)  # Green
    TEXT_COLOR = RGBColor(33, 33, 33)
    GRAY_COLOR = RGBColor(97, 97, 97)
    
    def add_title_slide(title, subtitle=""):
        """Add a title slide"""
        slide = prs.slides.add_slide(prs.slide_layouts[6])  # Blank layout
        title_box = slide.shapes.add_textbox(Inches(1), Inches(2), Inches(8), Inches(1.5))
        tf = title_box.text_frame
        tf.text = title
        p = tf.paragraphs[0]
        p.font.size = Pt(44)
        p.font.bold = True
        p.font.color.rgb = PRIMARY_COLOR
        p.alignment = PP_ALIGN.CENTER
        
        if subtitle:
            subtitle_box = slide.shapes.add_textbox(Inches(1), Inches(3.5), Inches(8), Inches(1))
            tf = subtitle_box.text_frame
            tf.text = subtitle
            p = tf.paragraphs[0]
            p.font.size = Pt(24)
            p.font.color.rgb = GRAY_COLOR
            p.alignment = PP_ALIGN.CENTER
    
    def add_content_slide(title, bullets):
        """Add a content slide with title and bullets"""
        slide = prs.slides.add_slide(prs.slide_layouts[1])  # Title and content
        title_shape = slide.shapes.title
        title_shape.text = title
        title_shape.text_frame.paragraphs[0].font.size = Pt(32)
        title_shape.text_frame.paragraphs[0].font.bold = True
        title_shape.text_frame.paragraphs[0].font.color.rgb = PRIMARY_COLOR
        
        content = slide.placeholders[1]
        tf = content.text_frame
        tf.word_wrap = True
        
        for i, bullet in enumerate(bullets):
            if i == 0:
                p = tf.paragraphs[0]
            else:
                p = tf.add_paragraph()
            
            p.text = bullet
            p.level = 0
            p.font.size = Pt(18)
            p.font.color.rgb = TEXT_COLOR
            p.space_after = Pt(12)
    
    def add_metric_slide(metric_num, metric_name, definition, formula="", calculation="", example=""):
        """Add a slide for a specific metric"""
        slide = prs.slides.add_slide(prs.slide_layouts[6])  # Blank layout
        
        # Title
        title_box = slide.shapes.add_textbox(Inches(0.5), Inches(0.3), Inches(9), Inches(0.8))
        tf = title_box.text_frame
        tf.text = f"{metric_num}. {metric_name}"
        p = tf.paragraphs[0]
        p.font.size = Pt(28)
        p.font.bold = True
        p.font.color.rgb = PRIMARY_COLOR
        
        y_pos = 1.3
        spacing = 0.5
        
        # Definition
        if definition:
            def_box = slide.shapes.add_textbox(Inches(0.5), Inches(y_pos), Inches(9), Inches(1))
            tf = def_box.text_frame
            tf.word_wrap = True
            tf.text = f"Definition: {definition}"
            p = tf.paragraphs[0]
            p.font.size = Pt(16)
            p.font.color.rgb = TEXT_COLOR
            y_pos += 1.2
        
        # Formula
        if formula:
            formula_box = slide.shapes.add_textbox(Inches(0.5), Inches(y_pos), Inches(9), Inches(0.8))
            tf = formula_box.text_frame
            tf.word_wrap = True
            tf.text = f"Formula: {formula}"
            p = tf.paragraphs[0]
            p.font.size = Pt(14)
            p.font.color.rgb = SECONDARY_COLOR
            p.font.bold = True
            y_pos += 1.0
        
        # Calculation/Example
        if calculation or example:
            calc_box = slide.shapes.add_textbox(Inches(0.5), Inches(y_pos), Inches(9), Inches(1.5))
            tf = calc_box.text_frame
            tf.word_wrap = True
            content = ""
            if calculation:
                content += f"Calculation: {calculation}\n\n"
            if example:
                content += f"Example: {example}"
            tf.text = content
            p = tf.paragraphs[0]
            p.font.size = Pt(14)
            p.font.color.rgb = TEXT_COLOR
    
    # Title Slide
    add_title_slide("TrafficRoutine", "AI-Powered Public Transit Route Optimization System\nfor Zambia's Bus Network")
    
    # Table of Contents
    add_content_slide("Presentation Overview", [
        "Project Overview",
        "Key Features",
        "Technology Stack",
        "System Metrics & Calculations",
        "Expected Demand",
        "ETA & Congestion Predictions",
        "Confidence & Optimization Scores",
        "System Capacity & Efficiency",
        "Technical Architecture",
        "Conclusion"
    ])
    
    # Project Overview
    add_content_slide("Project Overview", [
        "React Native application built with Expo for optimizing public transit routes",
        "AI-powered predictions for traffic congestion and passenger demand",
        "Real-time route optimization to reduce travel time and distance",
        "Comprehensive dashboard for system-wide performance monitoring",
        "Three main screens: Home, Route Planner, and Dashboard"
    ])
    
    # Features
    add_content_slide("Key Features", [
        "🗺️ Interactive Route Planning with Google Maps integration",
        "📊 Real-time Traffic Predictions using AI/ML",
        "🎯 Automatic Route Optimization with time savings",
        "📈 Performance Dashboard with system-wide metrics",
        "💾 Save and manage frequently used routes",
        "📱 Cross-platform: iOS, Android, and Web"
    ])
    
    # Technology Stack
    add_content_slide("Technology Stack", [
        "Frontend: React Native with Expo (~53.0.0)",
        "Backend: Convex (Real-time database and functions)",
        "Navigation: React Navigation (Stack & Bottom Tabs)",
        "Maps: React Native Maps with Google Maps API",
        "Language: TypeScript",
        "State Management: Convex React hooks"
    ])
    
    # Metrics Introduction
    add_content_slide("System Metrics & Calculations", [
        "The system tracks 9 key performance metrics",
        "All metrics use historical data and AI predictions",
        "Real-time calculations for route optimization",
        "Snapshot metrics (current state, not rates)",
        "Confidence scoring based on data availability"
    ])
    
    # Expected Demand
    add_metric_slide(
        "1", "Expected Demand (e.g., 78/120)",
        "Predicted number of passengers currently on a route at a snapshot moment",
        "predictedDemand = min(averageCapacity, avgHistoricalDemand × peakHourFactor)",
        "• Average last 5 historical records\n• Apply 1.4x multiplier during peak hours (6-9 AM)\n• Cap at maximum route capacity",
        "78 passengers currently on route / 120 maximum capacity\n(Snapshot at current moment, not per hour)"
    )
    
    # ETA
    add_metric_slide(
        "2", "ETA - Estimated Time of Arrival (e.g., 34 minutes)",
        "Estimated time for a vehicle to complete a route from start to destination",
        "ETA = (distance / averageSpeed) × 60",
        "• Distance: Route length in kilometers\n• Average Speed: 40 km/h (baseline)\n• Convert hours to minutes",
        "Route of 22.5 km: (22.5 / 40) × 60 = 33.75 ≈ 34 minutes"
    )
    
    # Predicted Congestion
    add_metric_slide(
        "3", "Predicted Congestion (e.g., 56%)",
        "Predicted traffic congestion level (0% = free-flowing, 100% = maximum congestion)",
        "predictedCongestion = min(100, avgCongestion × peakHourFactor)",
        "• Average congestion from last 5 records\n• Apply 1.4x multiplier during peak hours\n• Range: 0-100%",
        "56% = Moderate congestion\n0-30%: Low (Green)\n31-60%: Moderate (Yellow)\n61-100%: High (Red)"
    )
    
    # Expected Passengers
    add_metric_slide(
        "4", "Expected Passengers (e.g., 85 of 120)",
        "Same as Expected Demand, different display format. Snapshot metric of current passengers",
        "Identical to Expected Demand calculation",
        "• Same calculation as Expected Demand\n• Historical analysis + peak hour adjustment\n• Represents current passengers, not hourly rate",
        "85 passengers currently on route / 120 total capacity\n(To get hourly rate: multiply by route frequency)"
    )
    
    # Confidence Score
    add_metric_slide(
        "5", "Confidence Score (e.g., 95%)",
        "Measure of prediction reliability based on historical data availability",
        "confidenceScore = min(0.95, 0.7 + (dataPoints × 0.05))",
        "• Base confidence: 70%\n• +5% per historical data point (up to 5)\n• Maximum: 95%",
        "5 data points: 70% + (5 × 5%) = 95%\n≥90%: Very reliable\n75-89%: Moderate\n<75%: Lower reliability"
    )
    
    # Optimization Score
    add_metric_slide(
        "6", "Optimization Score (e.g., 27/100)",
        "Composite score evaluating route optimization (congestion, demand, confidence)",
        "optimizationScore = (congestionFactor × demandFactor × confidenceFactor) × 100",
        "• Congestion Factor: 1 - (congestion/100)\n• Demand Factor: demand/capacity\n• Confidence Factor: from confidence score",
        "27/100 indicates poor optimization\n80-100: Excellent\n60-79: Good\n40-59: Moderate\n20-39: Poor\n0-19: Very poor"
    )
    
    # Active Routes
    add_metric_slide(
        "7", "Active Routes (e.g., 3)",
        "Total number of transit routes currently active in the system",
        "activeRoutes = routes.length",
        "• Counts all routes in database\n• Updates in real-time\n• Simple count (no filtering)",
        "3 active routes in the system\n(Not filtered by time of operation or service status)"
    )
    
    # System Capacity
    add_metric_slide(
        "8", "System Capacity (e.g., 370 passengers)",
        "Total maximum passenger capacity across all routes at a snapshot moment",
        "systemCapacity = sum(routes.averageCapacity)",
        "• Sum of all route capacities\n• Snapshot metric (not per hour)\n• Theoretical maximum",
        "Route 1: 120 + Route 2: 100 + Route 3: 150 = 370 passengers\n(Total capacity of all vehicles at one moment)"
    )
    
    # System Efficiency Gain
    add_metric_slide(
        "9", "System Efficiency Gain (e.g., 12.5%)",
        "Overall improvement in system efficiency through route optimization",
        "efficiencyGain = (timeSaved / baselineETA) × 100",
        "• Per route: Time saved / Baseline ETA\n• System-wide: Average across routes\n• Currently fixed at 12.5%",
        "Time saved: 8.91 min, Baseline ETA: 33.75 min\nEfficiency Gain = (8.91 / 33.75) × 100 = 26.4%"
    )
    
    # System Assumptions
    add_content_slide("Key System Assumptions", [
        "Average Vehicle Speed: 40 km/h (baseline), 50 km/h (optimized)",
        "Peak Hours: 6:00 AM - 9:00 AM (1.4x multiplier)",
        "Route Optimization: 8% shorter distance, 15% faster time",
        "Historical Data: Uses last 5 traffic metric records",
        "Confidence: 70-95% based on data availability",
        "Snapshot Metrics: Current state, not hourly rates"
    ])
    
    # Technical Architecture
    add_content_slide("Technical Architecture", [
        "Frontend: React Native with Expo for cross-platform deployment",
        "Backend: Convex for real-time database and serverless functions",
        "State Management: Convex React hooks for reactive data",
        "Maps: Google Maps API integration for routing",
        "TypeScript: Type-safe development throughout",
        "Modular structure: Components, Screens, Hooks, Utilities"
    ])
    
    # Project Structure
    add_content_slide("Project Structure", [
        "components/ - Reusable UI components (Cards, Maps, Forms)",
        "screens/ - Main application screens (Home, Planner, Dashboard)",
        "convex/ - Backend functions (Routes, Traffic, Geocoding)",
        "hooks/ - Custom React hooks for API integration",
        "lib/ - Utility libraries (Route calculator, Theme, Geocoding)"
    ])
    
    # Conclusion
    add_content_slide("Conclusion & Next Steps", [
        "✅ Fully functional transit route optimization system",
        "✅ Real-time predictions using historical data",
        "✅ Comprehensive metrics and analytics dashboard",
        "✅ Cross-platform mobile and web support",
        "🔄 Future enhancements: Real-time GPS tracking, ML model integration",
        "🔄 Additional features: User authentication, route scheduling"
    ])
    
    # Thank You
    add_title_slide("Thank You", "Questions & Discussion")
    
    return prs

if __name__ == "__main__":
    print("Creating PowerPoint presentation...")
    prs = create_presentation()
    output_file = "TrafficRoutine_Presentation.pptx"
    prs.save(output_file)
    print(f"✓ Presentation saved as: {output_file}")
    print(f"✓ Total slides: {len(prs.slides)}")

