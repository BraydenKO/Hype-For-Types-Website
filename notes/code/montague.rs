//! # Montague Grammar in Rust
//!
//! This module implements a functional engine for Montague Grammar, a framework 
//! that treats natural language as a mathematical object.
//!
//! ## Core Concepts
//! 1. **The Type System**: Everything has a unique semantic type (e.g., entity, truth value).
//! 2. **Function Application**: Composing meanings is just applying functions (\beta-reduction).
//! 3. **Type Lifting**: Turning simple objects into complex ones to maintain structural uniformity.
//!
//! This implementation provides a "working" lambda calculus engine that can 
//! derive the logical form of sentences like "Every man sings."

use std::collections::HashMap;

/// ## 1. The Type System
/// Montague's "Rule of Types" ensures that only logically compatible meanings 
/// can be combined.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SemType {
    /// **e**: The type of entities (individuals like "John" or "The Eiffel Tower").
    E,
    /// **t**: The type of truth values (True or False). Sentences denote type **t**.
    T,
    /// **\alpha \to \beta**: A function from type \alpha to type \beta.
    /// e.g., a predicate like "sings" is **e \to t**.
    Func(Box<SemType>, Box<SemType>),
}

impl SemType {
    /// Creates a property type (e -> t), common for nouns and verbs.
    pub fn property() -> Self {
        SemType::Func(Box::new(SemType::E), Box::new(SemType::T))
    }

    /// Creates a Generalized Quantifier type ((e -> t) -> t).
    /// This is the type for NPs like "every man" or "John" (lifted).
    pub fn gq() -> Self {
        SemType::Func(Box::new(SemType::property()), Box::new(SemType::T))
    }
}

/// ## 2. Expressions (The Meaning Language)
/// We represent meanings using the Typed Lambda Calculus.
#[derive(Debug, Clone, PartialEq)]
pub enum Expr {
    /// A variable, usually bound by a Lambda or Quantifier.
    Var(String),
    
    /// A lexical constant (e.g., "John", "Man").
    Const(String, SemType),

    /// Lambda Abstraction: \lambda x: Type . Body
    /// This "builds" a function.
    Abs(String, SemType, Box<Expr>),
    
    /// Function Application: f(x)
    /// This "uses" a function.
    App(Box<Expr>, Box<Expr>),

    /// Logical Operators (Type: t -> t -> t)
    And(Box<Expr>, Box<Expr>),
    Implies(Box<Expr>, Box<Expr>),
    
    /// Quantifiers (Type: (e -> t) -> t)
    Forall(String, Box<Expr>),
    Exists(String, Box<Expr>),
}

impl Expr {
    /// ## 3. Beta-Reduction (\beta-reduction)
    /// This is where the "work" happens. When we apply a function to an argument,
    /// we substitute the argument for the bound variable.
    pub fn simplify(&self) -> Self {
        match self {
            Expr::App(func, arg) => {
                let f = func.simplify();
                let a = arg.simplify();
                if let Expr::Abs(var, _, body) = f {
                    // This is the core mechanism: substitute and recurse.
                    body.substitute(&var, &a).simplify()
                } else {
                    Expr::App(Box::new(f), Box::new(a))
                }
            }
            Expr::Abs(v, t, b) => Expr::Abs(v.clone(), t.clone(), Box::new(b.simplify())),
            Expr::And(l, r) => Expr::And(Box::new(l.simplify()), Box::new(r.simplify())),
            Expr::Implies(l, r) => Expr::Implies(Box::new(l.simplify()), Box::new(r.simplify())),
            Expr::Forall(v, b) => Expr::Forall(v.clone(), Box::new(b.simplify())),
            Expr::Exists(v, b) => Expr::Exists(v.clone(), Box::new(b.simplify())),
            _ => self.clone(),
        }
    }

    /// Internal helper to swap variables for expressions.
    fn substitute(&self, var: &str, replacement: &Expr) -> Self {
        match self {
            Expr::Var(name) if name == var => replacement.clone(),
            Expr::Abs(name, t, body) if name != var => {
                // Note: Real implementations need alpha-renaming to avoid variable capture.
                // For this tutorial, we assume unique variable names.
                Expr::Abs(name.clone(), t.clone(), Box::new(body.substitute(var, replacement)))
            }
            Expr::App(f, a) => Expr::App(
                Box::new(f.substitute(var, replacement)),
                Box::new(a.substitute(var, replacement)),
            ),
            Expr::And(l, r) => Expr::And(
                Box::new(l.substitute(var, replacement)),
                Box::new(r.substitute(var, replacement)),
            ),
            Expr::Implies(l, r) => Expr::Implies(
                Box::new(l.substitute(var, replacement)),
                Box::new(r.substitute(var, replacement)),
            ),
            Expr::Forall(name, body) if name != var => {
                Expr::Forall(name.clone(), Box::new(body.substitute(var, replacement)))
            }
            Expr::Exists(name, body) if name != var => {
                Expr::Exists(name.clone(), Box::new(body.substitute(var, replacement)))
            }
            _ => self.clone(),
        }
    }

    /// Formats the expression into a readable string (LaTeX-style).
    pub fn to_string(&self) -> String {
        match self {
            Expr::Var(s) => s.clone(),
            Expr::Const(s, _) => s.clone(),
            Expr::Abs(v, _, b) => format!("(\\lambda {}. {})", v, b.to_string()),
            Expr::App(f, a) => format!("{}({})", f.to_string(), a.to_string()),
            Expr::And(l, r) => format!("({} \\land {})", l.to_string(), r.to_string()),
            Expr::Implies(l, r) => format!("({} \\to {})", l.to_string(), r.to_string()),
            Expr::Forall(v, b) => format!("(\\forall {}. {})", v, b.to_string()),
            Expr::Exists(v, b) => format!("(\\exists {}. {})", v, b.to_string()),
        }
    }
}

/// ## 4. Type Lifting (Rule A)
/// In Montague Grammar, we lift individuals (type e) into sets of properties 
/// (type (e -> t) -> t). This allows "John" and "Every man" to have the same 
/// semantic type, so they can be used interchangeably in sentences.
pub fn lift_entity(name: &str) -> Expr {
    let entity = Expr::Const(name.to_string(), SemType::E);
    // Result: \lambda P . P(name)
    Expr::Abs(
        "P".into(), 
        SemType::property(),
        Box::new(Expr::App(
            Box::new(Expr::Var("P".into())),
            Box::new(entity)
        ))
    )
}

/// ## 5. The Lexicon
/// Assigns meanings to natural language words.
pub fn get_lexicon() -> HashMap<String, Expr> {
    let mut lex = HashMap::new();

    // "man" -> \lambda x . Man(x)
    lex.insert("man".to_string(), Expr::Abs(
        "x".into(), SemType::E, 
        Box::new(Expr::App(
            Box::new(Expr::Const("Man".into(), SemType::property())),
            Box::new(Expr::Var("x".into()))
        ))
    ));

    // "sings" -> \lambda x . Sings(x)
    lex.insert("sings".to_string(), Expr::Abs(
        "x".into(), SemType::E, 
        Box::new(Expr::App(
            Box::new(Expr::Const("Sings".into(), SemType::property())),
            Box::new(Expr::Var("x".into()))
        ))
    ));

    // "every" -> \lambda P . \lambda Q . \forall x . (P(x) \to Q(x))
    lex.insert("every".to_string(), Expr::Abs(
        "P".into(), SemType::property(),
        Box::new(Expr::Abs(
            "Q".into(), SemType::property(),
            Box::new(Expr::Forall(
                "x".into(),
                Box::new(Expr::Implies(
                    Box::new(Expr::App(Box::new(Expr::Var("P".into())), Box::new(Expr::Var("x".into())))),
                    Box::new(Expr::App(Box::new(Expr::Var("Q".into())), Box::new(Expr::Var("x".into()))))
                ))
            ))
        ))
    ));

    // "unicorn" -> \lambda x . Unicorn(x)
    lex.insert("unicorn".to_string(), Expr::Abs(
        "x".into(), SemType::E, 
        Box::new(Expr::App(
            Box::new(Expr::Const("Unicorn".into(), SemType::property())),
            Box::new(Expr::Var("x".into()))
        ))
    ));

    // "a" -> \lambda P . \lambda Q . \exists x . (P(x) \land Q(x))
    lex.insert("a".to_string(), Expr::Abs(
        "P".into(), SemType::property(),
        Box::new(Expr::Abs(
            "Q".into(), SemType::property(),
            Box::new(Expr::Exists(
                "x".into(),
                Box::new(Expr::And(
                    Box::new(Expr::App(Box::new(Expr::Var("P".into())), Box::new(Expr::Var("x".into())))),
                    Box::new(Expr::App(Box::new(Expr::Var("Q".into())), Box::new(Expr::Var("x".into()))))
                ))
            ))
        ))
    ));

    // "find" -> \lambda NP . \lambda u . NP(\lambda v . Find(u, v))
    // This is the "Meaning Postulate" implementation. It forces the NP (GQ)
    // to resolve its existential quantifier over the property of being found by 'u'.
    let transitive_type = SemType::Func(Box::new(SemType::E), Box::new(SemType::property()));
    lex.insert("find".to_string(), Expr::Abs(
        "NP".into(), SemType::gq(),
        Box::new(Expr::Abs(
            "u".into(), SemType::E,
            Box::new(Expr::App(
                Box::new(Expr::Var("NP".into())),
                Box::new(Expr::Abs(
                    "v".into(), SemType::E,
                    Box::new(Expr::App(
                        Box::new(Expr::App(Box::new(Expr::Const("Find".into(), transitive_type)), Box::new(Expr::Var("u".into())))),
                        Box::new(Expr::Var("v".into()))
                    ))
                ))
            ))
        ))
    ));

    lex
}

/// ## 6. Example Derivations
/// Shows how complex sentences are computed.
pub fn run_examples() {
    let lex = get_lexicon();
    
    // --- EXAMPLE 1: "Every man sings" ---
    let every = lex.get("every").unwrap();
    let man = lex.get("man").unwrap();
    let sings = lex.get("sings").unwrap();

    println!("--- EXAMPLE 1: 'Every man sings' ---");
    let every_man = Expr::App(Box::new(every.clone()), Box::new(man.clone())).simplify();
    let sentence1 = Expr::App(Box::new(every_man), Box::new(sings.clone())).simplify();
    println!("  Meaning: {}\n", sentence1.to_string());

    // --- EXAMPLE 2: "John sings" (with Type Lifting) ---
    // Here, "John" starts as an entity 'j', but is lifted to a GQ.
    println!("--- EXAMPLE 2: 'John sings' (with Type Lifting) ---");
    let john_lifted = lift_entity("j");
    println!("  John (lifted): {}", john_lifted.to_string());
    
    let sentence2 = Expr::App(Box::new(john_lifted), Box::new(sings.clone())).simplify();
    println!("  Meaning:       {}\n", sentence2.to_string());

    // --- EXAMPLE 3: "John finds a unicorn" (The Unicorn Problem) ---
    // Showcases the Meaning Postulate for extensional verbs.
    let a = lex.get("a").unwrap();
    let unicorn = lex.get("unicorn").unwrap();
    let find = lex.get("find").unwrap();
    let john = Expr::Const("j".into(), SemType::E);

    println!("--- EXAMPLE 3: 'John finds a unicorn' (The Unicorn Problem) ---");
    // 1. a(unicorn) -> GQ
    let a_unicorn = Expr::App(Box::new(a.clone()), Box::new(unicorn.clone())).simplify();
    // 2. find(a_unicorn) -> VP (property of subjects)
    let find_a_unicorn = Expr::App(Box::new(find.clone()), Box::new(a_unicorn)).simplify();
    // 3. (find a unicorn)(john) -> t
    let sentence3 = Expr::App(Box::new(find_a_unicorn), Box::new(john)).simplify();
    
    println!("  Meaning: {}", sentence3.to_string());
    println!("  (Note how the existential quantifier 'exists x' is now at the top level!)");
}

fn main() {
    run_examples();
}
