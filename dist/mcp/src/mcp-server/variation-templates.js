'use strict';
/**
 * Variation Templates for Different Screen Layouts
 * Each variation has a unique layout but uses CSS variables for theming
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.cssVariableDefinitions =
  exports.pricingVariations =
  exports.loginVariations =
  exports.dashboardVariations =
    void 0;
exports.getVariationHTML = getVariationHTML;
exports.dashboardVariations = [
  {
    name: 'Analytics Focus',
    description: 'Charts and metrics prominent',
    generateHTML: (screenType) => `
      <div style="padding: 2rem; background: var(--bg); min-height: 100vh; font-family: var(--font-family);">
        <h1 style="color: var(--text-primary); margin-bottom: 2rem;">Analytics Dashboard</h1>

        <!-- KPI Cards -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem;">
          <div style="background: var(--surface); padding: 1.5rem; border-radius: var(--border-radius); box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="color: var(--neutral); font-size: 0.875rem; margin-bottom: 0.5rem;">Total Revenue</div>
            <div style="color: var(--text-primary); font-size: 2rem; font-weight: 700;">$48.2K</div>
            <div style="color: var(--accent); font-size: 0.75rem;">↑ 12% from last month</div>
          </div>
          <div style="background: var(--surface); padding: 1.5rem; border-radius: var(--border-radius); box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="color: var(--neutral); font-size: 0.875rem; margin-bottom: 0.5rem;">Active Users</div>
            <div style="color: var(--text-primary); font-size: 2rem; font-weight: 700;">3,241</div>
            <div style="color: var(--accent); font-size: 0.75rem;">↑ 8% from last week</div>
          </div>
          <div style="background: var(--surface); padding: 1.5rem; border-radius: var(--border-radius); box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="color: var(--neutral); font-size: 0.875rem; margin-bottom: 0.5rem;">Conversion Rate</div>
            <div style="color: var(--text-primary); font-size: 2rem; font-weight: 700;">4.5%</div>
            <div style="color: var(--error); font-size: 0.75rem;">↓ 2% from last month</div>
          </div>
          <div style="background: var(--surface); padding: 1.5rem; border-radius: var(--border-radius); box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="color: var(--neutral); font-size: 0.875rem; margin-bottom: 0.5rem;">Avg Session</div>
            <div style="color: var(--text-primary); font-size: 2rem; font-weight: 700;">5:42</div>
            <div style="color: var(--accent); font-size: 0.75rem;">↑ 23s from average</div>
          </div>
        </div>

        <!-- Charts Section -->
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
          <!-- Line Chart -->
          <div style="background: var(--surface); padding: 2rem; border-radius: var(--border-radius); box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: var(--text-primary); margin-bottom: 1.5rem;">Revenue Trend</h3>
            <svg viewBox="0 0 600 200" style="width: 100%; height: 200px;">
              <polyline points="50,150 100,120 150,140 200,100 250,110 300,80 350,90 400,60 450,70 500,50"
                       style="fill:none; stroke:var(--primary); stroke-width:2"/>
              <line x1="50" y1="180" x2="500" y2="180" style="stroke:var(--neutral); stroke-width:1; opacity:0.3"/>
            </svg>
          </div>

          <!-- Donut Chart -->
          <div style="background: var(--surface); padding: 2rem; border-radius: var(--border-radius); box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: var(--text-primary); margin-bottom: 1.5rem;">Traffic Sources</h3>
            <svg viewBox="0 0 42 42" style="width: 150px; height: 150px; margin: 0 auto; display: block;">
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--bg)" stroke-width="3"/>
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--primary)" stroke-width="3"
                      stroke-dasharray="40 60" stroke-dashoffset="25" transform="rotate(-90 21 21)"/>
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--accent)" stroke-width="3"
                      stroke-dasharray="30 70" stroke-dashoffset="-15" transform="rotate(-90 21 21)"/>
            </svg>
          </div>
        </div>
      </div>
    `,
  },
  {
    name: 'Data Table Focus',
    description: 'Tables and lists prominent',
    generateHTML: (screenType) => `
      <div style="padding: 2rem; background: var(--bg); min-height: 100vh; font-family: var(--font-family);">
        <h1 style="color: var(--text-primary); margin-bottom: 2rem;">Operations Dashboard</h1>

        <!-- Summary Cards Row -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 2rem;">
          <div style="background: linear-gradient(135deg, var(--primary), var(--primary-dark)); padding: 2rem; border-radius: var(--border-radius); color: white;">
            <div style="font-size: 0.875rem; opacity: 0.9;">Total Orders</div>
            <div style="font-size: 2.5rem; font-weight: 700; margin: 0.5rem 0;">1,234</div>
            <div style="font-size: 0.875rem;">Processing: 89</div>
          </div>
          <div style="background: linear-gradient(135deg, var(--accent), var(--accent-dark)); padding: 2rem; border-radius: var(--border-radius); color: white;">
            <div style="font-size: 0.875rem; opacity: 0.9;">Revenue Today</div>
            <div style="font-size: 2.5rem; font-weight: 700; margin: 0.5rem 0;">$12.4K</div>
            <div style="font-size: 0.875rem;">Target: $15K</div>
          </div>
          <div style="background: linear-gradient(135deg, var(--success), var(--success-dark)); padding: 2rem; border-radius: var(--border-radius); color: white;">
            <div style="font-size: 0.875rem; opacity: 0.9;">Completion Rate</div>
            <div style="font-size: 2.5rem; font-weight: 700; margin: 0.5rem 0;">94%</div>
            <div style="font-size: 0.875rem;">Above target</div>
          </div>
        </div>

        <!-- Data Table -->
        <div style="background: var(--surface); border-radius: var(--border-radius); overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="padding: 1.5rem; border-bottom: 1px solid var(--border);">
            <h3 style="color: var(--text-primary); margin: 0;">Recent Transactions</h3>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: var(--bg);">
                <th style="padding: 1rem; text-align: left; color: var(--neutral); font-size: 0.875rem; font-weight: 600;">ID</th>
                <th style="padding: 1rem; text-align: left; color: var(--neutral); font-size: 0.875rem; font-weight: 600;">Customer</th>
                <th style="padding: 1rem; text-align: left; color: var(--neutral); font-size: 0.875rem; font-weight: 600;">Product</th>
                <th style="padding: 1rem; text-align: left; color: var(--neutral); font-size: 0.875rem; font-weight: 600;">Amount</th>
                <th style="padding: 1rem; text-align: left; color: var(--neutral); font-size: 0.875rem; font-weight: 600;">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 1rem; color: var(--text-primary);">#3241</td>
                <td style="padding: 1rem; color: var(--text-secondary);">Alice Johnson</td>
                <td style="padding: 1rem; color: var(--text-secondary);">Premium Plan</td>
                <td style="padding: 1rem; color: var(--text-primary); font-weight: 600;">$299</td>
                <td style="padding: 1rem;">
                  <span style="background: var(--success-light); color: var(--success); padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600;">Completed</span>
                </td>
              </tr>
              <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 1rem; color: var(--text-primary);">#3240</td>
                <td style="padding: 1rem; color: var(--text-secondary);">Bob Smith</td>
                <td style="padding: 1rem; color: var(--text-secondary);">Standard Plan</td>
                <td style="padding: 1rem; color: var(--text-primary); font-weight: 600;">$99</td>
                <td style="padding: 1rem;">
                  <span style="background: var(--warning-light); color: var(--warning); padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600;">Processing</span>
                </td>
              </tr>
              <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 1rem; color: var(--text-primary);">#3239</td>
                <td style="padding: 1rem; color: var(--text-secondary);">Carol White</td>
                <td style="padding: 1rem; color: var(--text-secondary);">Enterprise</td>
                <td style="padding: 1rem; color: var(--text-primary); font-weight: 600;">$999</td>
                <td style="padding: 1rem;">
                  <span style="background: var(--success-light); color: var(--success); padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600;">Completed</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `,
  },
  {
    name: 'Minimal Cards',
    description: 'Clean card-based layout',
    generateHTML: (screenType) => `
      <div style="padding: 3rem; background: var(--bg); min-height: 100vh; font-family: var(--font-family);">
        <div style="max-width: 1400px; margin: 0 auto;">
          <h1 style="color: var(--text-primary); margin-bottom: 3rem; font-size: 2.5rem; font-weight: 300;">Dashboard</h1>

          <!-- Grid of Cards -->
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem;">
            <!-- Performance Card -->
            <div style="background: var(--surface); padding: 2.5rem; border-radius: calc(var(--border-radius) * 1.5); border: 1px solid var(--border);">
              <h2 style="color: var(--text-primary); font-size: 1.125rem; margin-bottom: 2rem; font-weight: 500;">Performance</h2>
              <div style="display: flex; align-items: baseline; margin-bottom: 1rem;">
                <span style="font-size: 3rem; font-weight: 700; color: var(--primary);">89</span>
                <span style="font-size: 1.5rem; color: var(--neutral); margin-left: 0.5rem;">%</span>
              </div>
              <div style="height: 8px; background: var(--bg); border-radius: 4px; overflow: hidden;">
                <div style="width: 89%; height: 100%; background: linear-gradient(90deg, var(--primary), var(--accent));"></div>
              </div>
              <p style="color: var(--text-secondary); margin-top: 1rem; font-size: 0.875rem;">Above target by 14 points</p>
            </div>

            <!-- Activity Card -->
            <div style="background: var(--surface); padding: 2.5rem; border-radius: calc(var(--border-radius) * 1.5); border: 1px solid var(--border);">
              <h2 style="color: var(--text-primary); font-size: 1.125rem; margin-bottom: 2rem; font-weight: 500;">Recent Activity</h2>
              <div style="space-y: 1rem;">
                <div style="display: flex; align-items: center; margin-bottom: 1.5rem;">
                  <div style="width: 8px; height: 8px; background: var(--accent); border-radius: 50%; margin-right: 1rem;"></div>
                  <div style="flex: 1;">
                    <div style="color: var(--text-primary); font-size: 0.875rem;">New user registered</div>
                    <div style="color: var(--neutral); font-size: 0.75rem;">2 minutes ago</div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 1.5rem;">
                  <div style="width: 8px; height: 8px; background: var(--primary); border-radius: 50%; margin-right: 1rem;"></div>
                  <div style="flex: 1;">
                    <div style="color: var(--text-primary); font-size: 0.875rem;">Payment received</div>
                    <div style="color: var(--neutral); font-size: 0.75rem;">15 minutes ago</div>
                  </div>
                </div>
                <div style="display: flex; align-items: center;">
                  <div style="width: 8px; height: 8px; background: var(--warning); border-radius: 50%; margin-right: 1rem;"></div>
                  <div style="flex: 1;">
                    <div style="color: var(--text-primary); font-size: 0.875rem;">Server maintenance scheduled</div>
                    <div style="color: var(--neutral); font-size: 0.75rem;">1 hour ago</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Stats Card -->
            <div style="background: var(--surface); padding: 2.5rem; border-radius: calc(var(--border-radius) * 1.5); border: 1px solid var(--border);">
              <h2 style="color: var(--text-primary); font-size: 1.125rem; margin-bottom: 2rem; font-weight: 500;">Quick Stats</h2>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem;">
                <div>
                  <div style="color: var(--neutral); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Users</div>
                  <div style="color: var(--text-primary); font-size: 1.75rem; font-weight: 600;">12,543</div>
                </div>
                <div>
                  <div style="color: var(--neutral); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Revenue</div>
                  <div style="color: var(--text-primary); font-size: 1.75rem; font-weight: 600;">$48.2K</div>
                </div>
                <div>
                  <div style="color: var(--neutral); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Growth</div>
                  <div style="color: var(--accent); font-size: 1.75rem; font-weight: 600;">+23%</div>
                </div>
                <div>
                  <div style="color: var(--neutral); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">Churn</div>
                  <div style="color: var(--error); font-size: 1.75rem; font-weight: 600;">2.3%</div>
                </div>
              </div>
            </div>

            <!-- Actions Card -->
            <div style="background: linear-gradient(135deg, var(--primary), var(--accent)); padding: 2.5rem; border-radius: calc(var(--border-radius) * 1.5); color: white;">
              <h2 style="font-size: 1.125rem; margin-bottom: 2rem; font-weight: 500;">Quick Actions</h2>
              <div style="space-y: 1rem;">
                <button style="width: 100%; padding: 0.75rem; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); border-radius: var(--border-radius); color: white; font-weight: 500; cursor: pointer; backdrop-filter: blur(10px);">Generate Report</button>
                <button style="width: 100%; padding: 0.75rem; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); border-radius: var(--border-radius); color: white; font-weight: 500; cursor: pointer; backdrop-filter: blur(10px);">Export Data</button>
                <button style="width: 100%; padding: 0.75rem; background: white; border: none; border-radius: var(--border-radius); color: var(--primary); font-weight: 600; cursor: pointer;">View Analytics</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
  },
];
exports.loginVariations = [
  {
    name: 'Minimal',
    description: 'Clean and simple login',
    generateHTML: (screenType) => `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); font-family: var(--font-family);">
        <div style="width: 100%; max-width: 400px; padding: 2rem;">
          <div style="text-align: center; margin-bottom: 3rem;">
            <h1 style="color: var(--text-primary); font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem;">Welcome Back</h1>
            <p style="color: var(--text-secondary); font-size: 0.875rem;">Sign in to continue to your account</p>
          </div>

          <form style="space-y: 1.5rem;">
            <div style="margin-bottom: 1.5rem;">
              <input type="email" placeholder="Email address" style="width: 100%; padding: 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--border-radius); color: var(--text-primary); font-size: 1rem; font-family: var(--font-family);">
            </div>

            <div style="margin-bottom: 1.5rem;">
              <input type="password" placeholder="Password" style="width: 100%; padding: 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--border-radius); color: var(--text-primary); font-size: 1rem; font-family: var(--font-family);">
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
              <label style="display: flex; align-items: center; color: var(--text-secondary); font-size: 0.875rem;">
                <input type="checkbox" style="margin-right: 0.5rem;">
                Remember me
              </label>
              <a href="#" style="color: var(--primary); text-decoration: none; font-size: 0.875rem;">Forgot password?</a>
            </div>

            <button type="submit" style="width: 100%; padding: 1rem; background: var(--primary); color: white; border: none; border-radius: var(--border-radius); font-size: 1rem; font-weight: 600; cursor: pointer; font-family: var(--font-family);">
              Sign In
            </button>
          </form>

          <p style="text-align: center; margin-top: 2rem; color: var(--text-secondary); font-size: 0.875rem;">
            Don't have an account?
            <a href="#" style="color: var(--primary); text-decoration: none; font-weight: 600;">Sign up</a>
          </p>
        </div>
      </div>
    `,
  },
  {
    name: 'Split Screen',
    description: 'Half branding, half form',
    generateHTML: (screenType) => `
      <div style="min-height: 100vh; display: flex; font-family: var(--font-family);">
        <!-- Left Panel - Branding -->
        <div style="flex: 1; background: linear-gradient(135deg, var(--primary), var(--accent)); display: flex; align-items: center; justify-content: center; padding: 3rem;">
          <div style="text-align: center; color: white;">
            <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 20px; margin: 0 auto 2rem; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
              <span style="font-size: 2rem; font-weight: 700;">AI</span>
            </div>
            <h2 style="font-size: 2rem; margin-bottom: 1rem; font-weight: 300;">Welcome to AiDesigner</h2>
            <p style="opacity: 0.9; line-height: 1.6;">Create beautiful interfaces with the power of AI</p>
          </div>
        </div>

        <!-- Right Panel - Form -->
        <div style="flex: 1; background: var(--surface); display: flex; align-items: center; justify-content: center; padding: 3rem;">
          <div style="width: 100%; max-width: 400px;">
            <h1 style="color: var(--text-primary); font-size: 2rem; margin-bottom: 2rem;">Sign In</h1>

            <form>
              <div style="margin-bottom: 1.5rem;">
                <label style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">Email</label>
                <input type="email" style="width: 100%; padding: 0.75rem; background: var(--bg); border: 1px solid var(--border); border-radius: var(--border-radius); color: var(--text-primary); font-family: var(--font-family);">
              </div>

              <div style="margin-bottom: 2rem;">
                <label style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">Password</label>
                <input type="password" style="width: 100%; padding: 0.75rem; background: var(--bg); border: 1px solid var(--border); border-radius: var(--border-radius); color: var(--text-primary); font-family: var(--font-family);">
              </div>

              <button type="submit" style="width: 100%; padding: 0.875rem; background: var(--primary); color: white; border: none; border-radius: var(--border-radius); font-weight: 600; cursor: pointer; font-family: var(--font-family); margin-bottom: 1rem;">
                Continue
              </button>

              <div style="position: relative; text-align: center; margin: 2rem 0;">
                <span style="background: var(--surface); padding: 0 1rem; color: var(--text-secondary); font-size: 0.75rem; position: relative; z-index: 1;">OR CONTINUE WITH</span>
                <div style="position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: var(--border); z-index: 0;"></div>
              </div>

              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                <button style="padding: 0.75rem; background: var(--bg); border: 1px solid var(--border); border-radius: var(--border-radius); color: var(--text-primary); font-size: 0.875rem; cursor: pointer; font-family: var(--font-family);">Google</button>
                <button style="padding: 0.75rem; background: var(--bg); border: 1px solid var(--border); border-radius: var(--border-radius); color: var(--text-primary); font-size: 0.875rem; cursor: pointer; font-family: var(--font-family);">GitHub</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `,
  },
  {
    name: 'Card Floating',
    description: 'Card over gradient background',
    generateHTML: (screenType) => `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--primary), var(--accent)); font-family: var(--font-family); position: relative;">
        <!-- Background Pattern -->
        <div style="position: absolute; inset: 0; opacity: 0.1;">
          <svg width="100%" height="100%">
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="white"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <!-- Login Card -->
        <div style="background: var(--surface); padding: 3rem; border-radius: calc(var(--border-radius) * 2); box-shadow: 0 20px 40px rgba(0,0,0,0.1); width: 100%; max-width: 450px; position: relative;">
          <div style="text-align: center; margin-bottom: 2rem;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, var(--primary), var(--accent)); border-radius: 12px; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 1.5rem; font-weight: 700;">✦</span>
            </div>
            <h1 style="color: var(--text-primary); font-size: 1.75rem; margin-bottom: 0.5rem;">Sign In</h1>
            <p style="color: var(--text-secondary); font-size: 0.875rem;">Enter your credentials to access your account</p>
          </div>

          <form>
            <div style="margin-bottom: 1.25rem;">
              <input type="email" placeholder="name@example.com" style="width: 100%; padding: 1rem 1.25rem; background: var(--bg); border: 2px solid transparent; border-radius: var(--border-radius); color: var(--text-primary); font-size: 0.9375rem; transition: border-color 0.2s; font-family: var(--font-family);"
                     onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='transparent'">
            </div>

            <div style="margin-bottom: 0.75rem;">
              <input type="password" placeholder="Enter your password" style="width: 100%; padding: 1rem 1.25rem; background: var(--bg); border: 2px solid transparent; border-radius: var(--border-radius); color: var(--text-primary); font-size: 0.9375rem; transition: border-color 0.2s; font-family: var(--font-family);"
                     onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='transparent'">
            </div>

            <div style="text-align: right; margin-bottom: 1.5rem;">
              <a href="#" style="color: var(--primary); text-decoration: none; font-size: 0.875rem; font-weight: 500;">Forgot password?</a>
            </div>

            <button type="submit" style="width: 100%; padding: 1rem; background: linear-gradient(135deg, var(--primary), var(--accent)); color: white; border: none; border-radius: var(--border-radius); font-size: 0.9375rem; font-weight: 600; cursor: pointer; font-family: var(--font-family); transition: transform 0.2s;"
                    onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
              Sign In
            </button>

            <div style="text-align: center; margin-top: 1.5rem;">
              <span style="color: var(--text-secondary); font-size: 0.875rem;">New to platform?</span>
              <a href="#" style="color: var(--primary); text-decoration: none; font-weight: 600; margin-left: 0.25rem;">Create account</a>
            </div>
          </form>
        </div>
      </div>
    `,
  },
];
// Pricing variations with distinct layouts
exports.pricingVariations = [
  {
    name: 'Simple',
    description: 'Three-tier pricing cards',
    generateHTML: (designSpec) => `
      <div style="padding: 3rem 2rem; background: var(--bg); min-height: 100vh; font-family: var(--font-family);">
        <div style="max-width: 1200px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 3rem;">
            <h1 style="color: var(--text-primary); font-size: 2.5rem; margin-bottom: 1rem;">Simple, Transparent Pricing</h1>
            <p style="color: var(--text-secondary); font-size: 1.125rem;">Choose the perfect plan for your needs</p>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; align-items: center;">
            <!-- Basic Plan -->
            <div style="background: var(--surface); padding: 2rem; border-radius: var(--border-radius); border: 1px solid var(--border);">
              <h3 style="color: var(--text-primary); font-size: 1.25rem; margin-bottom: 0.5rem;">Basic</h3>
              <div style="margin: 1.5rem 0;">
                <span style="color: var(--text-primary); font-size: 2.5rem; font-weight: 700;">$9</span>
                <span style="color: var(--text-secondary);">/month</span>
              </div>
              <ul style="list-style: none; padding: 0; margin-bottom: 2rem;">
                <li style="padding: 0.5rem 0; color: var(--text-secondary);">✓ 5 Projects</li>
                <li style="padding: 0.5rem 0; color: var(--text-secondary);">✓ Basic Support</li>
                <li style="padding: 0.5rem 0; color: var(--text-secondary);">✓ 1GB Storage</li>
              </ul>
              <button style="width: 100%; padding: 0.75rem; background: var(--bg); border: 1px solid var(--primary); color: var(--primary); border-radius: var(--border-radius); font-weight: 600; cursor: pointer;">Get Started</button>
            </div>

            <!-- Pro Plan (Featured) -->
            <div style="background: var(--surface); padding: 2.5rem 2rem; border-radius: var(--border-radius); border: 2px solid var(--primary); position: relative; transform: scale(1.05);">
              <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--primary); color: white; padding: 0.25rem 1rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600;">MOST POPULAR</div>
              <h3 style="color: var(--text-primary); font-size: 1.25rem; margin-bottom: 0.5rem;">Pro</h3>
              <div style="margin: 1.5rem 0;">
                <span style="color: var(--primary); font-size: 2.5rem; font-weight: 700;">$29</span>
                <span style="color: var(--text-secondary);">/month</span>
              </div>
              <ul style="list-style: none; padding: 0; margin-bottom: 2rem;">
                <li style="padding: 0.5rem 0; color: var(--text-secondary);">✓ Unlimited Projects</li>
                <li style="padding: 0.5rem 0; color: var(--text-secondary);">✓ Priority Support</li>
                <li style="padding: 0.5rem 0; color: var(--text-secondary);">✓ 100GB Storage</li>
                <li style="padding: 0.5rem 0; color: var(--text-secondary);">✓ Advanced Analytics</li>
              </ul>
              <button style="width: 100%; padding: 0.75rem; background: var(--primary); color: white; border: none; border-radius: var(--border-radius); font-weight: 600; cursor: pointer;">Get Started</button>
            </div>

            <!-- Enterprise Plan -->
            <div style="background: var(--surface); padding: 2rem; border-radius: var(--border-radius); border: 1px solid var(--border);">
              <h3 style="color: var(--text-primary); font-size: 1.25rem; margin-bottom: 0.5rem;">Enterprise</h3>
              <div style="margin: 1.5rem 0;">
                <span style="color: var(--text-primary); font-size: 2.5rem; font-weight: 700;">$99</span>
                <span style="color: var(--text-secondary);">/month</span>
              </div>
              <ul style="list-style: none; padding: 0; margin-bottom: 2rem;">
                <li style="padding: 0.5rem 0; color: var(--text-secondary);">✓ Everything in Pro</li>
                <li style="padding: 0.5rem 0; color: var(--text-secondary);">✓ Dedicated Support</li>
                <li style="padding: 0.5rem 0; color: var(--text-secondary);">✓ Unlimited Storage</li>
                <li style="padding: 0.5rem 0; color: var(--text-secondary);">✓ Custom Integration</li>
                <li style="padding: 0.5rem 0; color: var(--text-secondary);">✓ SLA Guarantee</li>
              </ul>
              <button style="width: 100%; padding: 0.75rem; background: var(--bg); border: 1px solid var(--primary); color: var(--primary); border-radius: var(--border-radius); font-weight: 600; cursor: pointer;">Contact Sales</button>
            </div>
          </div>
        </div>
      </div>
    `,
  },
  {
    name: 'Featured',
    description: 'Table comparison with highlight',
    generateHTML: (designSpec) => `
      <div style="padding: 3rem 2rem; background: linear-gradient(180deg, var(--primary) 0%, var(--primary) 300px, var(--bg) 300px); min-height: 100vh; font-family: var(--font-family);">
        <div style="max-width: 900px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 3rem;">
            <h1 style="color: white; font-size: 2.5rem; margin-bottom: 1rem;">Choose Your Plan</h1>
            <p style="color: rgba(255,255,255,0.9); font-size: 1.125rem;">All plans include a 14-day free trial</p>
          </div>

          <div style="background: var(--surface); border-radius: var(--border-radius); padding: 2rem; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="text-align: left; padding: 1rem; border-bottom: 2px solid var(--border);"></th>
                  <th style="padding: 1rem; border-bottom: 2px solid var(--border); text-align: center;">
                    <div style="color: var(--text-secondary); font-size: 0.875rem;">Starter</div>
                    <div style="color: var(--text-primary); font-size: 1.5rem; font-weight: 700; margin: 0.5rem 0;">$19</div>
                  </th>
                  <th style="padding: 1rem; border-bottom: 2px solid var(--primary); background: var(--primary-light); text-align: center; position: relative;">
                    <div style="color: var(--primary); font-size: 0.875rem; font-weight: 600;">Professional</div>
                    <div style="color: var(--primary); font-size: 1.5rem; font-weight: 700; margin: 0.5rem 0;">$49</div>
                  </th>
                  <th style="padding: 1rem; border-bottom: 2px solid var(--border); text-align: center;">
                    <div style="color: var(--text-secondary); font-size: 0.875rem;">Business</div>
                    <div style="color: var(--text-primary); font-size: 1.5rem; font-weight: 700; margin: 0.5rem 0;">$99</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 1rem; border-bottom: 1px solid var(--border); color: var(--text-primary);">Users</td>
                  <td style="padding: 1rem; border-bottom: 1px solid var(--border); text-align: center; color: var(--text-secondary);">5</td>
                  <td style="padding: 1rem; border-bottom: 1px solid var(--border); text-align: center; background: var(--primary-light); color: var(--primary); font-weight: 600;">25</td>
                  <td style="padding: 1rem; border-bottom: 1px solid var(--border); text-align: center; color: var(--text-secondary);">Unlimited</td>
                </tr>
                <tr>
                  <td style="padding: 1rem; border-bottom: 1px solid var(--border); color: var(--text-primary);">Storage</td>
                  <td style="padding: 1rem; border-bottom: 1px solid var(--border); text-align: center; color: var(--text-secondary);">10GB</td>
                  <td style="padding: 1rem; border-bottom: 1px solid var(--border); text-align: center; background: var(--primary-light); color: var(--primary); font-weight: 600;">100GB</td>
                  <td style="padding: 1rem; border-bottom: 1px solid var(--border); text-align: center; color: var(--text-secondary);">1TB</td>
                </tr>
                <tr>
                  <td style="padding: 1rem; border-bottom: 1px solid var(--border); color: var(--text-primary);">Support</td>
                  <td style="padding: 1rem; border-bottom: 1px solid var(--border); text-align: center; color: var(--text-secondary);">Email</td>
                  <td style="padding: 1rem; border-bottom: 1px solid var(--border); text-align: center; background: var(--primary-light); color: var(--primary); font-weight: 600;">Priority</td>
                  <td style="padding: 1rem; border-bottom: 1px solid var(--border); text-align: center; color: var(--text-secondary);">24/7 Phone</td>
                </tr>
              </tbody>
            </table>

            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-top: 2rem;">
              <div></div>
              <button style="padding: 0.75rem; background: var(--bg); border: 1px solid var(--border); color: var(--text-secondary); border-radius: var(--border-radius); cursor: pointer;">Choose Plan</button>
              <button style="padding: 0.75rem; background: var(--primary); color: white; border: none; border-radius: var(--border-radius); font-weight: 600; cursor: pointer;">Choose Plan</button>
              <button style="padding: 0.75rem; background: var(--bg); border: 1px solid var(--border); color: var(--text-secondary); border-radius: var(--border-radius); cursor: pointer;">Choose Plan</button>
            </div>
          </div>
        </div>
      </div>
    `,
  },
  {
    name: 'Detailed',
    description: 'Feature-rich comparison layout',
    generateHTML: (designSpec) => `
      <div style="padding: 3rem 2rem; background: var(--bg); min-height: 100vh; font-family: var(--font-family);">
        <div style="max-width: 1200px; margin: 0 auto;">
          <h1 style="color: var(--text-primary); font-size: 2.5rem; text-align: center; margin-bottom: 3rem;">Pricing & Features</h1>

          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 3rem;">
            <!-- Pricing Cards -->
            <div>
              <h2 style="color: var(--text-primary); margin-bottom: 1.5rem;">Choose Your Plan</h2>
              <div style="display: flex; flex-direction: column; gap: 1rem;">
                <div style="background: var(--surface); padding: 1.5rem; border-radius: var(--border-radius); border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <h3 style="color: var(--text-primary);">Personal</h3>
                    <p style="color: var(--text-secondary); font-size: 0.875rem;">For individuals and freelancers</p>
                  </div>
                  <div style="text-align: right;">
                    <div style="color: var(--primary); font-size: 1.5rem; font-weight: 700;">$15/mo</div>
                    <button style="padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: var(--border-radius); font-size: 0.875rem; cursor: pointer;">Select</button>
                  </div>
                </div>

                <div style="background: var(--surface); padding: 1.5rem; border-radius: var(--border-radius); border: 2px solid var(--primary); display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <h3 style="color: var(--text-primary);">Team</h3>
                    <p style="color: var(--text-secondary); font-size: 0.875rem;">For growing teams</p>
                  </div>
                  <div style="text-align: right;">
                    <div style="color: var(--primary); font-size: 1.5rem; font-weight: 700;">$45/mo</div>
                    <button style="padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: var(--border-radius); font-size: 0.875rem; cursor: pointer;">Select</button>
                  </div>
                </div>

                <div style="background: var(--surface); padding: 1.5rem; border-radius: var(--border-radius); border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <h3 style="color: var(--text-primary);">Enterprise</h3>
                    <p style="color: var(--text-secondary); font-size: 0.875rem;">For large organizations</p>
                  </div>
                  <div style="text-align: right;">
                    <div style="color: var(--text-primary); font-size: 1.5rem; font-weight: 700;">Custom</div>
                    <button style="padding: 0.5rem 1rem; background: var(--bg); border: 1px solid var(--primary); color: var(--primary); border-radius: var(--border-radius); font-size: 0.875rem; cursor: pointer;">Contact</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Features List -->
            <div>
              <h2 style="color: var(--text-primary); margin-bottom: 1.5rem;">All Plans Include</h2>
              <div style="background: var(--surface); padding: 2rem; border-radius: var(--border-radius);">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div style="display: flex; align-items: start;">
                    <span style="color: var(--accent); margin-right: 0.5rem;">✓</span>
                    <span style="color: var(--text-secondary); font-size: 0.875rem;">Unlimited projects</span>
                  </div>
                  <div style="display: flex; align-items: start;">
                    <span style="color: var(--accent); margin-right: 0.5rem;">✓</span>
                    <span style="color: var(--text-secondary); font-size: 0.875rem;">SSL certificates</span>
                  </div>
                  <div style="display: flex; align-items: start;">
                    <span style="color: var(--accent); margin-right: 0.5rem;">✓</span>
                    <span style="color: var(--text-secondary); font-size: 0.875rem;">24/7 monitoring</span>
                  </div>
                  <div style="display: flex; align-items: start;">
                    <span style="color: var(--accent); margin-right: 0.5rem;">✓</span>
                    <span style="color: var(--text-secondary); font-size: 0.875rem;">API access</span>
                  </div>
                  <div style="display: flex; align-items: start;">
                    <span style="color: var(--accent); margin-right: 0.5rem;">✓</span>
                    <span style="color: var(--text-secondary); font-size: 0.875rem;">Git integration</span>
                  </div>
                  <div style="display: flex; align-items: start;">
                    <span style="color: var(--accent); margin-right: 0.5rem;">✓</span>
                    <span style="color: var(--text-secondary); font-size: 0.875rem;">Team collaboration</span>
                  </div>
                </div>

                <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border);">
                  <h3 style="color: var(--text-primary); font-size: 1rem; margin-bottom: 1rem;">Need Help Choosing?</h3>
                  <p style="color: var(--text-secondary); font-size: 0.875rem; line-height: 1.6;">Our team is here to help you find the perfect plan. Schedule a call with our sales team to discuss your needs.</p>
                  <button style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: var(--accent); color: white; border: none; border-radius: var(--border-radius); cursor: pointer;">Schedule a Call</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
  },
];
// Export function to get variation HTML with proper CSS variables
function getVariationHTML(screenType, variationIndex) {
  let variations = [];
  switch (screenType.toLowerCase()) {
    case 'dashboard':
      variations = exports.dashboardVariations;
      break;
    case 'login':
      variations = exports.loginVariations;
      break;
    default:
      // Return a default template
      return `<div style="padding: 2rem; text-align: center; font-family: var(--font-family); color: var(--text-primary); background: var(--bg);">
        <h2>${screenType} - Variation ${variationIndex + 1}</h2>
        <p>This variation will be generated based on the design system.</p>
      </div>`;
  }
  if (variations[variationIndex]) {
    return variations[variationIndex].generateHTML(screenType);
  }
  // Fallback to first variation if index out of bounds
  return variations[0]?.generateHTML(screenType) || '';
}
// CSS Variables that need to be defined in the root
exports.cssVariableDefinitions = `
  :root {
    /* Core Colors */
    --primary: #3B82F6;
    --primary-dark: #2563EB;
    --primary-light: #DBEAFE;
    --accent: #10B981;
    --accent-dark: #059669;
    --accent-light: #D1FAE5;
    --neutral: #6B7280;
    --bg: #F9FAFB;
    --surface: #FFFFFF;

    /* Semantic Colors */
    --success: #10B981;
    --success-dark: #059669;
    --success-light: #D1FAE5;
    --warning: #F59E0B;
    --warning-dark: #D97706;
    --warning-light: #FEF3C7;
    --error: #EF4444;
    --error-dark: #DC2626;
    --error-light: #FEE2E2;

    /* Text Colors */
    --text-primary: #111827;
    --text-secondary: #6B7280;

    /* Border */
    --border: #E5E7EB;

    /* Typography */
    --font-family: 'Inter', system-ui, sans-serif;

    /* Spacing */
    --border-radius: 8px;
  }

  /* Dark mode support */
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #111827;
      --surface: #1F2937;
      --text-primary: #F9FAFB;
      --text-secondary: #9CA3AF;
      --border: #374151;
    }
  }
`;
